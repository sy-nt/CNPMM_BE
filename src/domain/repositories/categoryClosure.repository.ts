import { CategoryClosureEntity } from "@domain/entities/categoryClosure.entity";
import { In } from "typeorm";

import { BaseRepository } from "./base";

export class CategoryClosureRepository extends BaseRepository<CategoryClosureEntity> {
    constructor() {
        super(CategoryClosureEntity);
    }

    deleteClosureForDescendants = async (
        descendantIds: string[],
    ): Promise<void> => {
        if (descendantIds.length === 0) return;
        await this.delete({ descendantId: In(descendantIds) });
    };

    findParentDepth = async (parentId: string): Promise<number> => {
        const row = await this.repository
            .createQueryBuilder("cc")
            .select("MAX(cc.depth)", "maxDepth")
            .where("cc.descendantId = :parentId", { parentId })
            .getRawOne<{ maxDepth: null | number }>();
        return row?.maxDepth ?? 0;
    };

    findSubtreeDepths = async (
        rootId: string,
        maxDepth: number,
    ): Promise<{ depth: number; descendantId: string }[]> => {
        return this.repository
            .createQueryBuilder("cc")
            .select("cc.descendantId", "descendantId")
            .addSelect("cc.depth", "depth")
            .where("cc.ancestorId = :rootId", { rootId })
            .andWhere("cc.depth <= :maxDepth", { maxDepth })
            .orderBy("cc.depth", "ASC")
            .getRawMany<{ depth: number; descendantId: string }>();
    };

    findSubtreeIds = async (rootId: string): Promise<string[]> => {
        const rows = await this.repository
            .createQueryBuilder("cc")
            .select("cc.descendantId", "descendantId")
            .where("cc.ancestorId = :rootId", { rootId })
            .getRawMany<{ descendantId: string }>();
        return rows.map((row) => row.descendantId);
    };

    insertClosureForNewNode = async (
        nodeId: string,
        parentId?: string,
    ): Promise<void> => {
        const queryRunner = await this._queryRunner();
        const manager = queryRunner.manager;
        await manager.insert(CategoryClosureEntity, {
            ancestorId: nodeId,
            depth: 0,
            descendantId: nodeId,
        });
        if (!parentId) return;
        await manager.query(
            `INSERT INTO category_closure (ancestor_id, descendant_id, depth)
             SELECT ancestor_id, ?, depth + 1
             FROM category_closure
             WHERE descendant_id = ?`,
            [nodeId, parentId],
        );
    };
}

const categoryClosureRepository = new CategoryClosureRepository();
export default categoryClosureRepository;
