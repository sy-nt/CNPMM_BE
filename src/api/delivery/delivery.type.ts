import { AddressEntity, DeliveryMethodEntity } from "@domain/entities";

import { DeliveryZoneCode } from "./delivery.constants";

export type DeliveryQuoteInput = {
    destination: AddressEntity;
    items: { quantity: number; skuId: string }[];
    method: DeliveryMethodEntity;
    origin: AddressEntity;
};

export type DeliveryQuoteResult = {
    etaMaxDays: number;
    etaMinDays: number;
    fee: string;
    zoneCode?: DeliveryZoneCode | string;
};
