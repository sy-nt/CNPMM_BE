import { AddressEntity } from "@domain/entities";
import { BaseService } from "@shared/lib/base/service";

import { AddressResponseDto } from "../address.dto";

export abstract class AddressBaseService extends BaseService {
    protected _toPublicResponse(address: AddressEntity): AddressResponseDto {
        return {
            addressLine: address.addressLine,
            city: address.city,
            country: address.country,
            district: address.district,
            id: address.id,
            isPrimary: address.isPrimary,
            name: address.name,
            state: address.state,
        };
    }
}
