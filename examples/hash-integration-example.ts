import { BreakdownLogger } from "../mod.ts";
import { createHash } from "https://deno.land/std@0.218.0/crypto/mod.ts";

/**
 * Real-world example: E-commerce order processing system with hash-based logging
 */

// Utility function to generate consistent hashes
function generateHash(...parts: string[]): string {
  const hash = createHash("md5");
  hash.update(parts.join(":"));
  return hash.toString().substring(0, 8);
}

// Order processing system with hash-based debugging
export class OrderProcessor {
  private systemLogger: BreakdownLogger;

  constructor() {
    // System-wide logger with consistent hash
    this.systemLogger = new BreakdownLogger(
      generateHash("OrderProcessor", "v1.0"),
    );
  }

  async processOrder(orderId: string, items: OrderItem[]) {
    // Create order-specific hash for tracking
    const orderHash = generateHash("order", orderId, Date.now().toString());
    const orderLogger = new BreakdownLogger(orderHash);

    orderLogger.info("Starting order processing", {
      orderId,
      itemCount: items.length,
    });

    try {
      // Step 1: Validate order
      await this.validateOrder(orderId, items, orderHash);

      // Step 2: Check inventory
      await this.checkInventory(items, orderHash);

      // Step 3: Process payment
      const paymentResult = await this.processPayment(
        orderId,
        items,
        orderHash,
      );

      // Step 4: Create shipment
      await this.createShipment(orderId, items, paymentResult, orderHash);

      orderLogger.info("Order processed successfully", { orderId });
    } catch (error) {
      const errorHash = generateHash("order-error", orderId, error.message);
      const errorLogger = new BreakdownLogger(errorHash);

      errorLogger.error("Order processing failed", {
        orderId,
        error: error.message,
        stack: error.stack,
        debugHint: `Run with LOG_KEY=${orderHash},${errorHash} for full trace`,
      });

      throw error;
    }
  }

  private validateOrder(
    orderId: string,
    items: OrderItem[],
    parentHash: string,
  ) {
    // Create sub-process hash linked to parent
    const validationHash = generateHash(parentHash, "validation");
    const logger = new BreakdownLogger(validationHash);

    logger.debug("Validating order", { orderId, itemCount: items.length });

    for (const item of items) {
      if (item.quantity <= 0) {
        logger.error("Invalid item quantity", { item });
        throw new Error(`Invalid quantity for item ${item.productId}`);
      }
    }

    logger.debug("Order validation passed");
  }

  private async checkInventory(items: OrderItem[], parentHash: string) {
    const inventoryHash = generateHash(parentHash, "inventory");
    const logger = new BreakdownLogger(inventoryHash);

    logger.debug("Checking inventory", {
      items: items.map((i) => i.productId),
    });

    // Simulate inventory check with potential failures
    for (const item of items) {
      const available = await this.getInventoryLevel(item.productId);

      if (available < item.quantity) {
        const shortageHash = generateHash(
          inventoryHash,
          "shortage",
          item.productId,
        );
        const shortageLogger = new BreakdownLogger(shortageHash);

        shortageLogger.warn("Inventory shortage detected", {
          productId: item.productId,
          requested: item.quantity,
          available,
        });

        throw new Error(`Insufficient inventory for ${item.productId}`);
      }
    }

    logger.debug("Inventory check passed");
  }

  private async processPayment(
    orderId: string,
    items: OrderItem[],
    parentHash: string,
  ) {
    const paymentHash = generateHash(parentHash, "payment");
    const logger = new BreakdownLogger(paymentHash);

    const total = items.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0,
    );

    logger.info("Processing payment", { orderId, total });

    // Simulate payment processing
    const transactionId = generateHash("tx", orderId, Date.now().toString());

    try {
      // Simulate payment gateway call
      await new Promise((resolve) => setTimeout(resolve, 100));

      logger.info("Payment successful", { transactionId });
      return { transactionId, amount: total };
    } catch (error) {
      const failureHash = generateHash(paymentHash, "failure");
      const failureLogger = new BreakdownLogger(failureHash);

      failureLogger.error("Payment failed", {
        orderId,
        error: error.message,
        debugCommand:
          `LOG_KEY=${paymentHash},${failureHash} LOG_LENGTH=W deno test`,
      });

      throw error;
    }
  }

  private createShipment(
    orderId: string,
    _items: OrderItem[],
    payment: PaymentResult,
    parentHash: string,
  ) {
    const shipmentHash = generateHash(parentHash, "shipment");
    const logger = new BreakdownLogger(shipmentHash);

    logger.debug("Creating shipment", {
      orderId,
      transactionId: payment.transactionId,
    });

    // Simulate shipment creation
    const shipmentId = generateHash("ship", orderId);

    logger.info("Shipment created", { shipmentId });
  }

  private getInventoryLevel(_productId: string): Promise<number> {
    // Simulate inventory lookup
    return Math.floor(Math.random() * 100);
  }
}

// Monitoring system that tracks specific operations
export class OrderMonitor {
  private monitors: Map<string, BreakdownLogger> = new Map();

  startMonitoring(orderId: string): string {
    const monitorHash = generateHash("monitor", orderId, Date.now().toString());
    const logger = new BreakdownLogger(monitorHash);

    this.monitors.set(orderId, logger);

    logger.info("Monitoring started", { orderId });

    return monitorHash;
  }

  logEvent(orderId: string, event: string, data?: unknown) {
    const logger = this.monitors.get(orderId);
    if (logger) {
      logger.debug(event, data);
    }
  }

  stopMonitoring(orderId: string) {
    const logger = this.monitors.get(orderId);
    if (logger) {
      logger.info("Monitoring stopped", { orderId });
      this.monitors.delete(orderId);
    }
  }
}

// Types
interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

interface PaymentResult {
  transactionId: string;
  amount: number;
}

// Example usage and debugging guide
if (import.meta.main) {
  console.log(`
=== Hash-based Order Processing Debug Guide ===

1. Track specific order:
   # First, run normally to get the order hash
   LOG_LEVEL=debug deno run examples/hash-integration-example.ts
   
   # Then use the hash to track that specific order
   LOG_KEY=<order-hash> LOG_LENGTH=L deno test

2. Debug payment issues:
   # Filter to payment-related logs only
   LOG_KEY=<payment-hash> LOG_LENGTH=W deno test

3. Track full order flow:
   # Use multiple hashes to see the complete flow
   LOG_KEY=<order-hash>,<validation-hash>,<inventory-hash>,<payment-hash>,<shipment-hash> deno test

4. Error investigation:
   # When an error occurs, the error log will show debug command
   # Copy and run the suggested LOG_KEY command

5. Monitor specific operations:
   # Use monitor hashes to track long-running operations
   LOG_KEY=<monitor-hash> deno test

Example order processing simulation:
`);

  // Simulate order processing
  const processor = new OrderProcessor();
  const monitor = new OrderMonitor();

  const orderId = "ORD-" + Date.now();
  const items: OrderItem[] = [
    { productId: "PROD-001", quantity: 2, price: 29.99 },
    { productId: "PROD-002", quantity: 1, price: 49.99 },
  ];

  const monitorHash = monitor.startMonitoring(orderId);
  console.log(`Monitor hash: ${monitorHash}`);

  try {
    await processor.processOrder(orderId, items);
    console.log("Order processed successfully!");
  } catch (error) {
    console.error("Order processing failed:", error.message);
  } finally {
    monitor.stopMonitoring(orderId);
  }
}
