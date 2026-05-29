import { AddressEntity } from "@domain/entities";

import { BaseRepository } from "./base";

export class AddressRepository extends BaseRepository<AddressEntity> {
    constructor() {
        super(AddressEntity);
    }
}

const addressRepository = new AddressRepository();
export default addressRepository;
