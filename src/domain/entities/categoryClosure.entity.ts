import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "typeorm";

import { CategoryEntity } from "./category.entity";

@Entity({
    name: "category_closure",
})
@Index(["ancestorId", "depth"])
@Index(["descendantId"])
export class CategoryClosureEntity {
    @JoinColumn({ name: "ancestor_id" })
    @ManyToOne(() => CategoryEntity, { nullable: false })
    ancestor!: CategoryEntity;

    @PrimaryColumn({
        length: 36,
        name: "ancestor_id",
        type: "char",
    })
    ancestorId!: string;

    @Column({
        name: "depth",
        type: "int",
    })
    depth!: number;

    @JoinColumn({ name: "descendant_id" })
    @ManyToOne(() => CategoryEntity, { nullable: false })
    descendant!: CategoryEntity;

    @PrimaryColumn({
        length: 36,
        name: "descendant_id",
        type: "char",
    })
    descendantId!: string;
}
