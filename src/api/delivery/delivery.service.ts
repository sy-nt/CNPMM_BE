import {
    AddressEntity,
    DeliveryEntity,
    DeliveryMethodEntity,
    DeliveryStatus,
} from "@domain/entities";
import { BaseService } from "@shared/lib/base/service";
import {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "@shared/lib/http/httpError";
import rbacService from "@shared/lib/rbac/rbac.service";
import { removeNil } from "@shared/utils/object";
import { In, Not } from "typeorm";

import {
    DELIVERY_STATUS_TRANSITIONS,
    DeliveryError,
} from "./delivery.constants";
import {
    CreateDeliveryMethodRequestDto,
    CreateDeliveryRateRequestDto,
    CreateDeliveryRequestDto,
    CreateDeliveryZoneRequestDto,
    DeleteByIdRequestDto,
    DeliveryMethodResponseDto,
    DeliveryQuoteMethodDto,
    DeliveryRateResponseDto,
    DeliveryResponseDto,
    DeliveryZoneResponseDto,
    GetDeliveriesRequestDto,
    GetDeliveriesResponseDto,
    GetDeliveryRatesRequestDto,
    GetDeliveryRatesResponseDto,
    GetDeliveryRequestDto,
    QuoteDeliveryRequestDto,
    QuoteDeliveryResponseDto,
    UpdateDeliveryMethodRequestDto,
    UpdateDeliveryRateRequestDto,
    UpdateDeliveryStatusRequestDto,
    UpdateDeliveryZoneRequestDto,
} from "./delivery.dto";
import { deliveryStrategyRegistry } from "./delivery.strategy";

export class DeliveryService extends BaseService {
    async createDelivery(
        dto: CreateDeliveryRequestDto,
    ): Promise<DeliveryResponseDto> {
        const [method, originAddress, destinationAddress] = await Promise.all([
            this._getActiveMethodOrThrow(dto.deliveryMethodId),
            this._getWarehouseOriginAddress(dto.warehouseId),
            this._getAddressOrThrow(
                dto.destinationAddressId,
                DeliveryError.DESTINATION_ADDRESS_NOT_FOUND,
            ),
        ]);
        const created = await this.repositories.delivery.create({
            deliveryMethodId: method.id,
            destinationAddressId: destinationAddress.id,
            etaMaxDays: dto.etaMaxDays,
            etaMinDays: dto.etaMinDays,
            fee: dto.fee,
            notes: dto.notes,
            orderId: dto.orderId,
            originAddressId: originAddress.id,
            providerCode: method.providerCode,
            status: DeliveryStatus.PENDING,
            zoneCode: dto.zoneCode,
        });
        return this._toDeliveryResponse(created);
    }

    async createMethod(
        dto: CreateDeliveryMethodRequestDto,
    ): Promise<DeliveryMethodResponseDto> {
        await this._ensureMethodCodeUnique(dto.code);
        const created = await this.repositories.deliveryMethod.create({
            code: dto.code,
            description: dto.description,
            etaMaxDays: dto.etaMaxDays,
            etaMinDays: dto.etaMinDays,
            isActive: dto.isActive ?? true,
            name: dto.name,
            providerCode: dto.providerCode,
        });
        return this._toMethodResponse(created);
    }

    async createRate(
        dto: CreateDeliveryRateRequestDto,
    ): Promise<DeliveryRateResponseDto> {
        await Promise.all([
            this._getMethodOrThrow(dto.deliveryMethodId),
            this._getZoneOrThrow(dto.deliveryZoneId),
        ]);
        await this._ensureRateUnique(dto.deliveryMethodId, dto.deliveryZoneId);
        const created = await this.repositories.deliveryZoneRate.create({
            baseFee: dto.baseFee,
            deliveryMethodId: dto.deliveryMethodId,
            deliveryZoneId: dto.deliveryZoneId,
        });
        return this._toRateResponse(created);
    }

    async createZone(
        dto: CreateDeliveryZoneRequestDto,
    ): Promise<DeliveryZoneResponseDto> {
        await this._ensureZoneCodeUnique(dto.code);
        const created = await this.repositories.deliveryZone.create({
            code: dto.code,
            description: dto.description,
            displayOrder: dto.displayOrder ?? 0,
            isActive: dto.isActive ?? true,
            name: dto.name,
        });
        return this._toZoneResponse(created);
    }

    async deleteMethod(dto: DeleteByIdRequestDto): Promise<void> {
        await this._getMethodOrThrow(dto.id);
        await this.repositories.deliveryMethod.softDelete({ id: dto.id });
    }

    async deleteRate(dto: DeleteByIdRequestDto): Promise<void> {
        const rate = await this.repositories.deliveryZoneRate.findOne({
            select: { id: true },
            where: { id: dto.id },
        });
        if (!rate) {
            throw new NotFoundError(DeliveryError.DELIVERY_RATE_NOT_FOUND);
        }
        await this.repositories.deliveryZoneRate.softDelete({ id: dto.id });
    }

    async deleteZone(dto: DeleteByIdRequestDto): Promise<void> {
        await this._getZoneOrThrow(dto.id);
        await this.repositories.deliveryZone.softDelete({ id: dto.id });
    }

    async getDeliveries(
        dto: GetDeliveriesRequestDto,
    ): Promise<GetDeliveriesResponseDto> {
        const isAdmin = await rbacService.isAdmin(dto.callerRoleId);
        const where = await this._buildDeliveriesWhere(dto, isAdmin);
        if (where === null) {
            return this._emptyPage(dto);
        }
        const result = await this.repositories.delivery.paginate(
            { where },
            {
                limit: dto.limit,
                orderBy: dto.orderBy,
                page: dto.page,
                sort: dto.sort,
            },
        );
        return {
            ...result,
            items: result.items.map((item) => this._toDeliveryResponse(item)),
        };
    }

    async getDelivery(
        dto: GetDeliveryRequestDto,
    ): Promise<DeliveryResponseDto> {
        const delivery = await this._getDeliveryOrThrow(dto.id);
        const isAdmin = await rbacService.isAdmin(dto.callerRoleId);
        await this._assertDeliveryAccess(delivery, dto.callerShopId, isAdmin);
        return this._toDeliveryResponse(delivery);
    }

    async getMethod(
        dto: DeleteByIdRequestDto,
    ): Promise<DeliveryMethodResponseDto> {
        const method = await this._getMethodOrThrow(dto.id);
        return this._toMethodResponse(method);
    }

    async getMethods(): Promise<DeliveryMethodResponseDto[]> {
        const methods = await this.repositories.deliveryMethod.find({
            order: { name: "ASC" },
            where: { isActive: true },
        });
        return methods.map((method) => this._toMethodResponse(method));
    }

    async getRates(
        dto: GetDeliveryRatesRequestDto,
    ): Promise<GetDeliveryRatesResponseDto> {
        const { deliveryMethodId, deliveryZoneId, ...pagination } = dto;
        const result = await this.repositories.deliveryZoneRate.paginate(
            {
                where: removeNil({ deliveryMethodId, deliveryZoneId }),
            },
            pagination,
        );
        return {
            ...result,
            items: result.items.map((row) => this._toRateResponse(row)),
        };
    }

    async getZones(): Promise<DeliveryZoneResponseDto[]> {
        const zones = await this.repositories.deliveryZone.find({
            order: { displayOrder: "ASC" },
        });
        return zones.map((zone) => this._toZoneResponse(zone));
    }

    async quote(
        dto: QuoteDeliveryRequestDto,
    ): Promise<QuoteDeliveryResponseDto> {
        if (!dto.callerUserId) {
            throw new ForbiddenError(DeliveryError.DELIVERY_FORBIDDEN);
        }
        const [originAddress, destinationAddress] = await Promise.all([
            this._getWarehouseOriginAddress(dto.warehouseId),
            this._getOwnedAddressOrThrow(dto.addressId, dto.callerUserId),
        ]);
        const methods = await this.repositories.deliveryMethod.find({
            where: { isActive: true },
        });
        const quotes = await Promise.all(
            methods.map((method) =>
                this._safeQuote(method, originAddress, destinationAddress, dto),
            ),
        );
        return {
            methods: quotes.filter((q): q is DeliveryQuoteMethodDto => !!q),
        };
    }

    async updateDeliveryStatus(
        dto: UpdateDeliveryStatusRequestDto,
    ): Promise<DeliveryResponseDto> {
        const delivery = await this._getDeliveryOrThrow(dto.id);
        const isAdmin = await rbacService.isAdmin(dto.callerRoleId);
        await this._assertDeliveryAccess(delivery, dto.callerShopId, isAdmin);
        this._assertStatusTransition(delivery.status, dto.status);
        const updates = removeNil({
            notes: dto.notes,
            status: dto.status,
            trackingCode: dto.trackingCode,
        });
        await this.repositories.delivery.update({ id: dto.id }, updates);
        const refreshed = await this._getDeliveryOrThrow(dto.id);
        return this._toDeliveryResponse(refreshed);
    }

    async updateMethod(
        dto: UpdateDeliveryMethodRequestDto,
    ): Promise<DeliveryMethodResponseDto> {
        const target = await this._getMethodOrThrow(dto.id);
        if (dto.code && dto.code !== target.code) {
            await this._ensureMethodCodeUnique(dto.code, dto.id);
        }
        const { id, ...rest } = dto;
        const updates = removeNil(rest);
        if (Object.keys(updates).length === 0)
            return this._toMethodResponse(target);
        await this.repositories.deliveryMethod.update({ id }, updates);
        const refreshed = await this._getMethodOrThrow(id);
        return this._toMethodResponse(refreshed);
    }

    async updateRate(
        dto: UpdateDeliveryRateRequestDto,
    ): Promise<DeliveryRateResponseDto> {
        const target = await this.repositories.deliveryZoneRate.findOne({
            where: { id: dto.id },
        });
        if (!target) {
            throw new NotFoundError(DeliveryError.DELIVERY_RATE_NOT_FOUND);
        }
        const { id, ...rest } = dto;
        const updates = removeNil(rest);
        if (Object.keys(updates).length === 0)
            return this._toRateResponse(target);
        await this.repositories.deliveryZoneRate.update({ id }, updates);
        const refreshed = await this.repositories.deliveryZoneRate.findOne({
            where: { id },
        });
        return this._toRateResponse(refreshed!);
    }

    async updateZone(
        dto: UpdateDeliveryZoneRequestDto,
    ): Promise<DeliveryZoneResponseDto> {
        const target = await this._getZoneOrThrow(dto.id);
        if (dto.code && dto.code !== target.code) {
            await this._ensureZoneCodeUnique(dto.code, dto.id);
        }
        const { id, ...rest } = dto;
        const updates = removeNil(rest);
        if (Object.keys(updates).length === 0)
            return this._toZoneResponse(target);
        await this.repositories.deliveryZone.update({ id }, updates);
        const refreshed = await this._getZoneOrThrow(id);
        return this._toZoneResponse(refreshed);
    }

    private async _assertDeliveryAccess(
        delivery: DeliveryEntity,
        callerShopId: string | undefined,
        isAdmin: boolean,
    ): Promise<void> {
        if (isAdmin) return;
        if (callerShopId) {
            const warehouses = await this.repositories.warehouse.find({
                select: { addressId: true },
                where: { shopId: callerShopId },
            });
            const owned = warehouses.some(
                (w) => w.addressId === delivery.originAddressId,
            );
            if (owned) return;
        }
        throw new ForbiddenError(DeliveryError.DELIVERY_FORBIDDEN);
    }

    private _assertStatusTransition(
        from: DeliveryStatus,
        to: DeliveryStatus,
    ): void {
        if (from === to) return;
        const allowed = DELIVERY_STATUS_TRANSITIONS[from] ?? [];
        if (!allowed.includes(to)) {
            throw new BadRequestError(
                DeliveryError.DELIVERY_STATUS_TRANSITION_INVALID,
            );
        }
    }

    private async _buildDeliveriesWhere(
        dto: GetDeliveriesRequestDto,
        isAdmin: boolean,
    ) {
        const statusFilter = dto.status ? { status: dto.status } : {};
        if (isAdmin) return statusFilter;
        if (dto.callerShopId) {
            const warehouses = await this.repositories.warehouse.find({
                select: { addressId: true },
                where: { shopId: dto.callerShopId },
            });
            const addressIds = warehouses.map((w) => w.addressId);
            if (addressIds.length === 0) return null;
            return { ...statusFilter, originAddressId: In(addressIds) };
        }
        return null;
    }

    private _emptyPage(dto: GetDeliveriesRequestDto): GetDeliveriesResponseDto {
        return {
            currentPage: dto.page,
            items: [],
            limit: dto.limit,
            total: 0,
            totalPage: 0,
        };
    }

    private async _ensureMethodCodeUnique(
        code: string,
        ignoreId?: string,
    ): Promise<void> {
        const existing = await this.repositories.deliveryMethod.findOne({
            select: { id: true },
            where: removeNil({
                code,
                id: ignoreId ? Not(ignoreId) : undefined,
            }),
            withDeleted: true,
        });
        if (existing) {
            throw new ConflictError(
                DeliveryError.DELIVERY_METHOD_CODE_ALREADY_EXISTS,
            );
        }
    }

    private async _ensureRateUnique(
        deliveryMethodId: string,
        deliveryZoneId: string,
    ): Promise<void> {
        const existing = await this.repositories.deliveryZoneRate.findOne({
            select: { id: true },
            where: { deliveryMethodId, deliveryZoneId },
            withDeleted: true,
        });
        if (existing) {
            throw new ConflictError(DeliveryError.DELIVERY_RATE_ALREADY_EXISTS);
        }
    }

    private async _ensureZoneCodeUnique(
        code: string,
        ignoreId?: string,
    ): Promise<void> {
        const existing = await this.repositories.deliveryZone.findOne({
            select: { id: true },
            where: removeNil({
                code,
                id: ignoreId ? Not(ignoreId) : undefined,
            }),
            withDeleted: true,
        });
        if (existing) {
            throw new ConflictError(
                DeliveryError.DELIVERY_ZONE_CODE_ALREADY_EXISTS,
            );
        }
    }

    private async _getActiveMethodOrThrow(
        id: string,
    ): Promise<DeliveryMethodEntity> {
        const method = await this._getMethodOrThrow(id);
        if (!method.isActive) {
            throw new BadRequestError(DeliveryError.DELIVERY_METHOD_INACTIVE);
        }
        return method;
    }

    private async _getAddressOrThrow(
        id: string,
        notFoundMessage: DeliveryError,
    ): Promise<AddressEntity> {
        const address = await this.repositories.address.findOne({
            where: { id },
        });
        if (!address) {
            throw new NotFoundError(notFoundMessage);
        }
        return address;
    }

    private async _getDeliveryOrThrow(id: string): Promise<DeliveryEntity> {
        const delivery = await this.repositories.delivery.findOne({
            where: { id },
        });
        if (!delivery) {
            throw new NotFoundError(DeliveryError.DELIVERY_NOT_FOUND);
        }
        return delivery;
    }

    private async _getMethodOrThrow(id: string): Promise<DeliveryMethodEntity> {
        const method = await this.repositories.deliveryMethod.findOne({
            where: { id },
        });
        if (!method) {
            throw new NotFoundError(DeliveryError.DELIVERY_METHOD_NOT_FOUND);
        }
        return method;
    }

    private async _getOwnedAddressOrThrow(
        addressId: string,
        callerUserId: string,
    ): Promise<AddressEntity> {
        const address = await this.repositories.address.findOne({
            where: { id: addressId, userId: callerUserId },
        });
        if (!address) {
            throw new NotFoundError(
                DeliveryError.DESTINATION_ADDRESS_NOT_FOUND,
            );
        }
        return address;
    }

    private async _getWarehouseOriginAddress(
        warehouseId: string,
    ): Promise<AddressEntity> {
        const warehouse = await this.repositories.warehouse.findOne({
            select: { addressId: true, id: true },
            where: { id: warehouseId },
        });
        if (!warehouse) {
            throw new NotFoundError(DeliveryError.WAREHOUSE_NOT_FOUND);
        }
        return this._getAddressOrThrow(
            warehouse.addressId,
            DeliveryError.WAREHOUSE_NOT_FOUND,
        );
    }

    private async _getZoneOrThrow(id: string) {
        const zone = await this.repositories.deliveryZone.findOne({
            where: { id },
        });
        if (!zone) {
            throw new NotFoundError(DeliveryError.DELIVERY_ZONE_NOT_FOUND);
        }
        return zone;
    }

    private async _safeQuote(
        method: DeliveryMethodEntity,
        origin: AddressEntity,
        destination: AddressEntity,
        dto: QuoteDeliveryRequestDto,
    ): Promise<DeliveryQuoteMethodDto | null> {
        try {
            const strategy = deliveryStrategyRegistry.get(method.providerCode);
            const result = await strategy.quote({
                destination,
                items: dto.items,
                method,
                origin,
            });
            return {
                code: method.code,
                etaMaxDays: result.etaMaxDays,
                etaMinDays: result.etaMinDays,
                fee: result.fee,
                methodId: method.id,
                name: method.name,
                providerCode: method.providerCode,
                zoneCode: result.zoneCode,
            };
        } catch (error) {
            this.logger.warn(
                `delivery quote skipped method=${method.code} reason=${(error as Error).message}`,
            );
            return null;
        }
    }

    private _toDeliveryResponse(entity: DeliveryEntity): DeliveryResponseDto {
        return {
            deliveryMethodId: entity.deliveryMethodId,
            destinationAddressId: entity.destinationAddressId,
            etaMaxDays: entity.etaMaxDays,
            etaMinDays: entity.etaMinDays,
            fee: entity.fee,
            id: entity.id,
            notes: entity.notes,
            orderId: entity.orderId,
            originAddressId: entity.originAddressId,
            providerCode: entity.providerCode,
            status: entity.status,
            trackingCode: entity.trackingCode,
            zoneCode: entity.zoneCode,
        };
    }

    private _toMethodResponse(
        entity: DeliveryMethodEntity,
    ): DeliveryMethodResponseDto {
        return {
            code: entity.code,
            description: entity.description,
            etaMaxDays: entity.etaMaxDays,
            etaMinDays: entity.etaMinDays,
            id: entity.id,
            isActive: entity.isActive,
            name: entity.name,
            providerCode: entity.providerCode,
        };
    }

    private _toRateResponse(entity: {
        baseFee: string;
        deliveryMethodId: string;
        deliveryZoneId: string;
        id: string;
    }): DeliveryRateResponseDto {
        return {
            baseFee: entity.baseFee,
            deliveryMethodId: entity.deliveryMethodId,
            deliveryZoneId: entity.deliveryZoneId,
            id: entity.id,
        };
    }

    private _toZoneResponse(entity: {
        code: string;
        description?: string;
        displayOrder: number;
        id: string;
        isActive: boolean;
        name: string;
    }): DeliveryZoneResponseDto {
        return {
            code: entity.code,
            description: entity.description,
            displayOrder: entity.displayOrder,
            id: entity.id,
            isActive: entity.isActive,
            name: entity.name,
        };
    }
}

const deliveryService = new DeliveryService();
export default deliveryService;
