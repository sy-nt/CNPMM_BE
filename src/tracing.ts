import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { WinstonInstrumentation } from "@opentelemetry/instrumentation-winston";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { NodeSDK } from "@opentelemetry/sdk-node";

const logExporter = new OTLPLogExporter({});

const traceExporter = new OTLPTraceExporter({
    url: "http://localhost:4318/v1/traces",
});

const sdk = new NodeSDK({
    instrumentations: [
        new WinstonInstrumentation({}),
        getNodeAutoInstrumentations({
            "@opentelemetry/instrumentation-mongodb": {
                enabled: true,
            },
        }),
    ],
    logRecordProcessors: [new BatchLogRecordProcessor(logExporter)],
    resource: resourceFromAttributes({
        "service.name": "api",
    }),
    traceExporter,
});
sdk.start();

process.on("SIGTERM", () => {
    sdk.shutdown()
        // eslint-disable-next-line no-console
        .then(() => console.log("OpenTelemetry SDK shut down successfully"))
        // eslint-disable-next-line no-console
        .catch((error) => console.error("Error shutting down SDK", error))
        .finally(() => process.exit(0));
});
