import { WarehouseEntity } from "@domain/entities";

import { BaseRepository } from "./base";

export class WarehouseRepository extends BaseRepository<WarehouseEntity> {
    constructor() {
        super(WarehouseEntity);
    }
}

const warehouseRepository = new WarehouseRepository();
export default warehouseRepository;
