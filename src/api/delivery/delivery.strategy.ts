import { AddressEntity } from "@domain/entities";
import { BaseService } from "@shared/lib/base/service";
import { BadRequestError, NotFoundError } from "@shared/lib/http/httpError";

import {
    DELIVERY_DEFAULT_PROVIDER_CODE,
    DeliveryError,
    DeliveryZoneCode,
} from "./delivery.constants";
import { DeliveryQuoteInput, DeliveryQuoteResult } from "./delivery.type";

export interface DeliveryQuoteStrategy {
    readonly code: string;
    quote(input: DeliveryQuoteInput): Promise<DeliveryQuoteResult>;
}

export class DeliveryStrategyRegistry {
    private readonly strategies = new Map<string, DeliveryQuoteStrategy>();

    get(code: string): DeliveryQuoteStrategy {
        const strategy = this.strategies.get(code);
        if (!strategy) {
            throw new BadRequestError(
                DeliveryError.DELIVERY_STRATEGY_NOT_FOUND,
            );
        }
        return strategy;
    }

    register(strategy: DeliveryQuoteStrategy): void {
        this.strategies.set(strategy.code, strategy);
    }
}

export const classifyZone = (
    origin: AddressEntity,
    destination: AddressEntity,
): DeliveryZoneCode => {
    if (_diff(origin.country, destination.country)) {
        return DeliveryZoneCode.CROSS_COUNTRY;
    }
    if (_diff(origin.state, destination.state)) {
        return DeliveryZoneCode.SAME_COUNTRY;
    }
    if (_diff(origin.city, destination.city)) {
        return DeliveryZoneCode.SAME_STATE;
    }
    if (_diff(origin.district, destination.district)) {
        return DeliveryZoneCode.SAME_CITY;
    }
    return DeliveryZoneCode.SAME_DISTRICT;
};

export class ZoneTableStrategy
    extends BaseService
    implements DeliveryQuoteStrategy
{
    readonly code = DELIVERY_DEFAULT_PROVIDER_CODE;

    async quote(input: DeliveryQuoteInput): Promise<DeliveryQuoteResult> {
        const zoneCode = classifyZone(input.origin, input.destination);
        const zone = await this.repositories.deliveryZone.findOne({
            select: { id: true },
            where: { code: zoneCode, isActive: true },
        });
        if (!zone) {
            throw new NotFoundError(DeliveryError.DELIVERY_ZONE_NOT_FOUND);
        }
        const rate = await this.repositories.deliveryZoneRate.findOne({
            select: { baseFee: true },
            where: {
                deliveryMethodId: input.method.id,
                deliveryZoneId: zone.id,
            },
        });
        if (!rate) {
            throw new BadRequestError(
                DeliveryError.DELIVERY_RATE_NOT_CONFIGURED,
            );
        }
        return {
            etaMaxDays: input.method.etaMaxDays,
            etaMinDays: input.method.etaMinDays,
            fee: rate.baseFee,
            zoneCode,
        };
    }
}

export const deliveryStrategyRegistry = new DeliveryStrategyRegistry();
deliveryStrategyRegistry.register(new ZoneTableStrategy());

const _diff = (a: string, b: string): boolean =>
    a.trim().toLowerCase() !== b.trim().toLowerCase();
