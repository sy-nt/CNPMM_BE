import { CategoryEntity } from "@domain/entities/category.entity";
import { CategoryClosureEntity } from "@domain/entities/categoryClosure.entity";
import slugify from "slugify";
import { EntityManager } from "typeorm";
import { v7 as uuidv7 } from "uuid";

type CategoryDef = {
    children?: CategoryDef[];
    name: string;
};

type FlattenResult = {
    categoryRows: {
        displayOrder: number;
        id: string;
        isActive: boolean;
        name: string;
        parentId?: string;
        slug: string;
    }[];
    closureRows: {
        ancestorId: string;
        depth: number;
        descendantId: string;
    }[];
};

const CATEGORY_TREE: CategoryDef[] = [
    {
        children: [
            {
                children: [{ name: "Smartphones" }, { name: "Feature Phones" }],
                name: "Phones",
            },
            {
                children: [{ name: "Gaming Laptops" }, { name: "Ultrabooks" }],
                name: "Laptops",
            },
            { name: "Tablets" },
            { name: "Cameras" },
            { name: "Headphones" },
            { name: "Smart Watches" },
        ],
        name: "Electronics",
    },
    {
        children: [
            {
                children: [{ name: "Shirts" }, { name: "Pants" }],
                name: "Men's Clothing",
            },
            {
                children: [{ name: "Dresses" }, { name: "Tops" }],
                name: "Women's Clothing",
            },
            { name: "Shoes" },
            { name: "Bags" },
            { name: "Accessories" },
        ],
        name: "Fashion",
    },
    {
        children: [
            { name: "Cookware" },
            { name: "Furniture" },
            { name: "Bedding" },
            { name: "Lighting" },
            { name: "Storage" },
            { name: "Appliances" },
        ],
        name: "Home & Kitchen",
    },
    {
        children: [
            { name: "Skincare" },
            { name: "Makeup" },
            { name: "Haircare" },
            { name: "Fragrance" },
            { name: "Bath & Body" },
        ],
        name: "Beauty & Personal Care",
    },
    {
        children: [
            { name: "Vitamins" },
            { name: "Medical Supplies" },
            { name: "Fitness Equipment" },
            { name: "Personal Hygiene" },
        ],
        name: "Health & Wellness",
    },
    {
        children: [
            { name: "Cycling" },
            { name: "Camping" },
            { name: "Fishing" },
            { name: "Team Sports" },
            { name: "Yoga" },
        ],
        name: "Sports & Outdoors",
    },
    {
        children: [
            { name: "Fiction" },
            { name: "Non-Fiction" },
            { name: "Comics" },
            { name: "Textbooks" },
            { name: "Children's Books" },
        ],
        name: "Books",
    },
    {
        children: [
            { name: "Board Games" },
            { name: "Action Figures" },
            { name: "Puzzles" },
            { name: "Educational Toys" },
            { name: "Outdoor Toys" },
        ],
        name: "Toys & Games",
    },
    {
        children: [
            { name: "Car Accessories" },
            { name: "Motorcycle Accessories" },
            { name: "Tools" },
            { name: "Oils & Fluids" },
            { name: "Tires" },
        ],
        name: "Automotive",
    },
    {
        children: [
            {
                children: [{ name: "Coffee" }, { name: "Tea" }],
                name: "Beverages",
            },
            { name: "Snacks" },
            { name: "Dairy" },
            { name: "Fresh Produce" },
            { name: "Frozen Foods" },
        ],
        name: "Groceries",
    },
    {
        children: [
            { name: "Dog Supplies" },
            { name: "Cat Supplies" },
            { name: "Fish Supplies" },
            { name: "Bird Supplies" },
        ],
        name: "Pet Supplies",
    },
    {
        children: [
            { name: "Diapers" },
            { name: "Baby Food" },
            { name: "Strollers" },
            { name: "Kids Clothing" },
            { name: "Baby Toys" },
        ],
        name: "Baby & Kids",
    },
    {
        children: [
            { name: "Stationery" },
            { name: "Printers" },
            { name: "Desks" },
            { name: "Organizers" },
        ],
        name: "Office Supplies",
    },
    {
        children: [
            { name: "Plants" },
            { name: "Garden Tools" },
            { name: "Outdoor Furniture" },
            { name: "BBQ & Grills" },
        ],
        name: "Garden & Outdoor",
    },
    {
        children: [
            { name: "Guitars" },
            { name: "Keyboards" },
            { name: "Drums" },
            { name: "DJ Equipment" },
            { name: "Microphones" },
        ],
        name: "Music & Instruments",
    },
];

const flattenTree = (
    defs: CategoryDef[],
    ancestors: string[] = [],
    acc: FlattenResult = { categoryRows: [], closureRows: [] },
): FlattenResult => {
    for (const def of defs) {
        const id = uuidv7();
        const parentId = ancestors.at(-1);
        acc.categoryRows.push({
            displayOrder: 0,
            id,
            isActive: true,
            name: def.name,
            parentId,
            slug: slugify(def.name, { lower: true, strict: true }),
        });
        acc.closureRows.push({ ancestorId: id, depth: 0, descendantId: id });
        for (let i = 0; i < ancestors.length; i++) {
            acc.closureRows.push({
                ancestorId: ancestors[i],
                depth: ancestors.length - i,
                descendantId: id,
            });
        }
        if (def.children) {
            flattenTree(def.children, [...ancestors, id], acc);
        }
    }
    return acc;
};

export const seedCategories = async (manager: EntityManager) => {
    const { categoryRows, closureRows } = flattenTree(CATEGORY_TREE);
    const categoryRepository = manager.getRepository(CategoryEntity);
    await categoryRepository.save(categoryRepository.create(categoryRows));
    await manager.insert(CategoryClosureEntity, closureRows);
};
