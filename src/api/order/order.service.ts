import {
    CancelOrderRequestDto,
    CheckoutPreviewRequestDto,
    CheckoutPreviewResponseDto,
    GetOrderRequestDto,
    GetOrdersRequestDto,
    GetOrdersResponseDto,
    OrderResponseDto,
    PlaceOrderRequestDto,
    PlaceOrderResponseDto,
    UpdateOrderStatusRequestDto,
} from "./order.dto";
import {
    orderCheckoutService,
    orderLifecycleService,
    orderQueryService,
} from "./services";

export class OrderService {
    cancelOrder(dto: CancelOrderRequestDto): Promise<OrderResponseDto> {
        return orderLifecycleService.cancelOrder(dto);
    }

    getOrder(dto: GetOrderRequestDto): Promise<OrderResponseDto> {
        return orderQueryService.getOrder(dto);
    }

    getOrders(dto: GetOrdersRequestDto): Promise<GetOrdersResponseDto> {
        return orderQueryService.getOrders(dto);
    }

    placeOrder(dto: PlaceOrderRequestDto): Promise<PlaceOrderResponseDto> {
        return orderCheckoutService.placeOrder(dto);
    }

    previewCheckout(
        dto: CheckoutPreviewRequestDto,
    ): Promise<CheckoutPreviewResponseDto> {
        return orderCheckoutService.previewCheckout(dto);
    }

    updateOrderStatus(
        dto: UpdateOrderStatusRequestDto,
    ): Promise<OrderResponseDto> {
        return orderLifecycleService.updateOrderStatus(dto);
    }
}

const orderService = new OrderService();
export default orderService;
