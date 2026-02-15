import { BreakdownLogger } from "../mod.ts";

/**
 * Real-world usage scenario tests for BreakdownLogger
 */

Deno.test("BreakdownLogger - Real-world Scenarios", async (t) => {
  await t.step("database operations logging", async (t) => {
    await t.step("should log database connection lifecycle", () => {
      const dbLogger = new BreakdownLogger("database");

      // Simulate database operations
      dbLogger.info("Database connection attempt", {
        host: "localhost",
        port: 5432,
        database: "testdb",
      });

      dbLogger.info("Connection established", {
        connectionId: "conn_123",
        poolSize: 10,
      });

      dbLogger.debug("Query execution", {
        sql: "SELECT * FROM users WHERE id = $1",
        params: [123],
        executionTime: 15.2,
      });

      dbLogger.warn("Connection pool warning", {
        activeConnections: 8,
        maxConnections: 10,
        message: "Pool approaching capacity",
      });

      // Completes without errors
    });

    await t.step("should handle database errors", () => {
      const dbLogger = new BreakdownLogger("database");

      dbLogger.error("Database connection failed", {
        error: "Connection timeout",
        host: "localhost",
        port: 5432,
        retryAttempt: 3,
        maxRetries: 5,
      });

      dbLogger.error("Query failed", {
        sql: "INVALID SQL SYNTAX",
        error: "Syntax error at line 1",
        errorCode: "42601",
      });

      // Completes without errors
    });
  });

  await t.step("API request/response logging", async (t) => {
    await t.step("should log HTTP request lifecycle", () => {
      const apiLogger = new BreakdownLogger("api");

      // Incoming request
      apiLogger.info("Incoming request", {
        method: "POST",
        url: "/api/users",
        headers: {
          "content-type": "application/json",
          "user-agent": "TestClient/1.0",
        },
        clientIp: "192.168.1.100",
      });

      // Request processing
      apiLogger.debug("Request validation", {
        valid: true,
        bodySize: 256,
        contentType: "application/json",
      });

      apiLogger.debug("Business logic execution", {
        operation: "createUser",
        processingTime: 45.7,
      });

      // Response
      apiLogger.info("Request completed", {
        statusCode: 201,
        responseTime: 67.3,
        bodySize: 156,
      });

      // Completes without errors
    });

    await t.step("should log rate limiting scenarios", () => {
      const apiLogger = new BreakdownLogger("api");

      // Rate limiting warnings
      for (let i = 1; i <= 5; i++) {
        apiLogger.warn("Rate limit approaching", {
          clientIp: "192.168.1.100",
          requestCount: 90 + i,
          limitPerMinute: 100,
          timeWindow: "1m",
        });
      }

      // Rate limit exceeded
      apiLogger.error("Rate limit exceeded", {
        clientIp: "192.168.1.100",
        requestCount: 101,
        limitPerMinute: 100,
        action: "blocked",
      });

      // Completes without errors
    });
  });

  await t.step("authentication and security logging", async (t) => {
    await t.step("should log authentication events", () => {
      const authLogger = new BreakdownLogger("auth");

      // Successful authentication
      authLogger.info("User login successful", {
        userId: "user_123",
        username: "testuser",
        loginMethod: "password",
        clientIp: "192.168.1.100",
        userAgent: "Browser/1.0",
      });

      // Failed authentication
      authLogger.warn("Login attempt failed", {
        username: "testuser",
        reason: "invalid_password",
        clientIp: "192.168.1.100",
        attemptCount: 2,
      });

      // Security event
      authLogger.error("Multiple failed login attempts", {
        username: "testuser",
        clientIp: "192.168.1.100",
        attemptCount: 5,
        timeWindow: "5m",
        action: "account_locked",
      });

      // Completes without errors
    });

    await t.step("should log permission checks", () => {
      const authLogger = new BreakdownLogger("auth");

      authLogger.debug("Permission check", {
        userId: "user_123",
        resource: "/api/admin/users",
        permission: "read",
        granted: false,
        reason: "insufficient_privileges",
      });

      authLogger.debug("Role verification", {
        userId: "user_123",
        requiredRole: "admin",
        userRoles: ["user", "editor"],
        result: "denied",
      });

      // Completes without errors
    });
  });

  await t.step("business workflow logging", async (t) => {
    await t.step("should log order processing workflow", () => {
      const workflowLogger = new BreakdownLogger("workflow");

      const orderId = "order_456";

      // Order created
      workflowLogger.info("Order created", {
        orderId,
        customerId: "customer_789",
        items: [
          { sku: "ITEM001", quantity: 2, price: 29.99 },
          { sku: "ITEM002", quantity: 1, price: 19.99 },
        ],
        totalAmount: 79.97,
      });

      // Payment processing
      workflowLogger.info("Payment processing started", {
        orderId,
        paymentMethod: "credit_card",
        amount: 79.97,
      });

      workflowLogger.info("Payment successful", {
        orderId,
        transactionId: "txn_123",
        processorResponse: "approved",
      });

      // Inventory management
      workflowLogger.debug("Inventory check", {
        orderId,
        items: [
          { sku: "ITEM001", requested: 2, available: 15 },
          { sku: "ITEM002", requested: 1, available: 3 },
        ],
        result: "sufficient",
      });

      // Fulfillment
      workflowLogger.info("Order fulfillment started", {
        orderId,
        warehouseId: "WH001",
        estimatedShipDate: "2023-12-02",
      });

      // Completes without errors
    });
  });

  await t.step("error recovery scenarios", async (t) => {
    await t.step("should log service recovery", () => {
      const serviceLogger = new BreakdownLogger("service");

      // Service failure
      serviceLogger.error("Service unavailable", {
        service: "payment-gateway",
        error: "Connection timeout",
        downtime: "30s",
      });

      // Retry attempts
      for (let attempt = 1; attempt <= 3; attempt++) {
        serviceLogger.warn("Retry attempt", {
          service: "payment-gateway",
          attempt,
          maxAttempts: 3,
          backoffDelay: attempt * 1000,
        });
      }

      // Recovery
      serviceLogger.info("Service recovered", {
        service: "payment-gateway",
        downtime: "125s",
        recoveryMethod: "circuit_breaker_reset",
      });

      // Completes without errors
    });
  });

  await t.step("monitoring and metrics", async (t) => {
    await t.step("should log performance metrics", () => {
      const metricsLogger = new BreakdownLogger("metrics");

      // System metrics
      metricsLogger.info("System metrics", {
        timestamp: new Date().toISOString(),
        cpu: {
          usage: 45.2,
          cores: 4,
        },
        memory: {
          used: 1024 * 1024 * 1024, // 1GB
          total: 4 * 1024 * 1024 * 1024, // 4GB
          percentage: 25.0,
        },
        disk: {
          used: "50GB",
          total: "100GB",
          percentage: 50.0,
        },
      });

      // Application metrics
      metricsLogger.info("Application metrics", {
        activeUsers: 156,
        requestsPerMinute: 450,
        averageResponseTime: 125.6,
        errorRate: 0.02,
      });

      // Completes without errors
    });
  });
});
