import { CreatedResponse, OkResponse } from "@shared/decorators/response";
import { extractRequest } from "@shared/helper/request";
import { RequestContextService } from "@shared/lib/context";
import { Request } from "express";

import {
    CreateDeliveryMethodRequestDto,
    CreateDeliveryRateRequestDto,
    CreateDeliveryZoneRequestDto,
    GetDeliveriesRequestDto,
    GetDeliveryRatesRequestDto,
    QuoteDeliveryRequestDto,
    UpdateDeliveryMethodRequestDto,
    UpdateDeliveryRateRequestDto,
    UpdateDeliveryStatusRequestDto,
    UpdateDeliveryZoneRequestDto,
} from "./delivery.dto";
import deliveryService from "./delivery.service";

export class DeliveryController {
    @CreatedResponse()
    async createMethod(req: Request) {
        const dto = extractRequest<CreateDeliveryMethodRequestDto>(req, "body");
        return deliveryService.createMethod(dto);
    }

    @CreatedResponse()
    async createRate(req: Request) {
        const dto = extractRequest<CreateDeliveryRateRequestDto>(req, "body");
        return deliveryService.createRate(dto);
    }

    @CreatedResponse()
    async createZone(req: Request) {
        const dto = extractRequest<CreateDeliveryZoneRequestDto>(req, "body");
        return deliveryService.createZone(dto);
    }

    @OkResponse()
    async deleteMethod(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        return deliveryService.deleteMethod({ id });
    }

    @OkResponse()
    async deleteRate(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        return deliveryService.deleteRate({ id });
    }

    @OkResponse()
    async deleteZone(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        return deliveryService.deleteZone({ id });
    }

    @OkResponse()
    async getDeliveries(req: Request) {
        const query = extractRequest<GetDeliveriesRequestDto>(req, "query");
        const jwtPayload = RequestContextService.getJwtPayload();
        return deliveryService.getDeliveries({
            ...query,
            callerRoleId: jwtPayload?.roleId,
            callerShopId: jwtPayload?.assignedShopId,
            callerUserId: jwtPayload?.userId,
        });
    }

    @OkResponse()
    async getDelivery(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const jwtPayload = RequestContextService.getJwtPayload();
        return deliveryService.getDelivery({
            callerRoleId: jwtPayload?.roleId,
            callerShopId: jwtPayload?.assignedShopId,
            callerUserId: jwtPayload?.userId,
            id,
        });
    }

    @OkResponse()
    async getMethod(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        return deliveryService.getMethod({ id });
    }

    @OkResponse()
    async getMethods() {
        return deliveryService.getMethods();
    }

    @OkResponse()
    async getRates(req: Request) {
        const query = extractRequest<GetDeliveryRatesRequestDto>(req, "query");
        return deliveryService.getRates(query);
    }

    @OkResponse()
    async getZones() {
        return deliveryService.getZones();
    }

    @OkResponse()
    async quote(req: Request) {
        const dto = extractRequest<QuoteDeliveryRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload();
        return deliveryService.quote({
            ...dto,
            callerUserId: jwtPayload?.userId,
        });
    }

    @OkResponse()
    async updateDeliveryStatus(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const dto = extractRequest<UpdateDeliveryStatusRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload();
        return deliveryService.updateDeliveryStatus({
            ...dto,
            callerRoleId: jwtPayload?.roleId,
            callerShopId: jwtPayload?.assignedShopId,
            id,
        });
    }

    @OkResponse()
    async updateMethod(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const dto = extractRequest<UpdateDeliveryMethodRequestDto>(req, "body");
        return deliveryService.updateMethod({ ...dto, id });
    }

    @OkResponse()
    async updateRate(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const dto = extractRequest<UpdateDeliveryRateRequestDto>(req, "body");
        return deliveryService.updateRate({ ...dto, id });
    }

    @OkResponse()
    async updateZone(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const dto = extractRequest<UpdateDeliveryZoneRequestDto>(req, "body");
        return deliveryService.updateZone({ ...dto, id });
    }
}

const deliveryController = new DeliveryController();
export default deliveryController;
