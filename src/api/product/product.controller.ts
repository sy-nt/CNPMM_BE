import { CreatedResponse, OkResponse } from "@shared/decorators/response";
import { extractRequest } from "@shared/helper/request";
import { RequestContextService } from "@shared/lib/context";
import { Request } from "express";

import {
    CreateAttributeRequestDto,
    CreateAttributeValueRequestDto,
    CreateProductRequestDto,
    CreateSkuRequestDto,
    GetProductsRequestDto,
    SetSkuInventoryRequestDto,
    SetSkuSelectionsRequestDto,
    UpdateAttributeRequestDto,
    UpdateAttributeValueRequestDto,
    UpdateProductRequestDto,
    UpdateSkuRequestDto,
} from "./product.dto";
import productService from "./product.service";

export class ProductController {
    @CreatedResponse()
    async addAttribute(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const dto = extractRequest<CreateAttributeRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload();
        return productService.addAttribute({
            ...dto,
            productId: id,
            shopId: jwtPayload!.assignedShopId!,
        });
    }

    @CreatedResponse()
    async addAttributeValue(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const dto = extractRequest<CreateAttributeValueRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload();
        return productService.addAttributeValue({
            ...dto,
            attributeId: id,
            shopId: jwtPayload!.assignedShopId!,
        });
    }

    @CreatedResponse()
    async addSku(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const dto = extractRequest<CreateSkuRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload();
        return productService.addSku({
            ...dto,
            productId: id,
            shopId: jwtPayload!.assignedShopId!,
        });
    }

    @CreatedResponse()
    async createProduct(req: Request) {
        const dto = extractRequest<CreateProductRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload();
        return productService.createProduct({
            ...dto,
            shopId: jwtPayload!.assignedShopId!,
        });
    }

    @OkResponse()
    async deleteAttribute(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const jwtPayload = RequestContextService.getJwtPayload();
        return productService.deleteAttribute({
            id,
            shopId: jwtPayload!.assignedShopId!,
        });
    }

    @OkResponse()
    async deleteAttributeValue(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const jwtPayload = RequestContextService.getJwtPayload();
        return productService.deleteAttributeValue({
            id,
            shopId: jwtPayload!.assignedShopId!,
        });
    }

    @OkResponse()
    async deleteProduct(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const jwtPayload = RequestContextService.getJwtPayload();
        return productService.deleteProduct({
            id,
            shopId: jwtPayload!.assignedShopId!,
        });
    }

    @OkResponse()
    async deleteSku(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const jwtPayload = RequestContextService.getJwtPayload();
        return productService.deleteSku({
            id,
            shopId: jwtPayload!.assignedShopId!,
        });
    }

    @OkResponse()
    async getProduct(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        return productService.getProduct({
            id,
        });
    }

    @OkResponse()
    async getProducts(req: Request) {
        const dto = extractRequest<GetProductsRequestDto>(req, "query");
        return productService.getProducts({
            ...dto,
        });
    }

    @OkResponse()
    async setSkuInventory(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const dto = extractRequest<SetSkuInventoryRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload();
        return productService.setSkuInventory({
            ...dto,
            id,
            shopId: jwtPayload!.assignedShopId!,
        });
    }

    @OkResponse()
    async setSkuSelections(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const dto = extractRequest<SetSkuSelectionsRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload();
        return productService.setSkuSelections({
            ...dto,
            id,
            shopId: jwtPayload!.assignedShopId!,
        });
    }

    @OkResponse()
    async updateAttribute(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const dto = extractRequest<UpdateAttributeRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload();
        return productService.updateAttribute({
            ...dto,
            id,
            shopId: jwtPayload!.assignedShopId!,
        });
    }

    @OkResponse()
    async updateAttributeValue(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const dto = extractRequest<UpdateAttributeValueRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload();
        return productService.updateAttributeValue({
            ...dto,
            id,
            shopId: jwtPayload!.assignedShopId!,
        });
    }

    @OkResponse()
    async updateProduct(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const dto = extractRequest<UpdateProductRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload();
        return productService.updateProduct({
            ...dto,
            id,
            shopId: jwtPayload!.assignedShopId!,
        });
    }

    @OkResponse()
    async updateSku(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const dto = extractRequest<UpdateSkuRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload();
        return productService.updateSku({
            ...dto,
            id,
            shopId: jwtPayload!.assignedShopId!,
        });
    }
}

const productController = new ProductController();
export default productController;
