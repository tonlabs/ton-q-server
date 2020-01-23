// @flow

import type { QConfig } from "./config";
import { FORMAT_BINARY } from "opentracing";

const initJaegerTracer = require('jaeger-client').initTracerFromEnv;
const { Tags, FORMAT_TEXT_MAP } = require('opentracing');


export interface TracerSpan {
    log(options: { event: string, value: any }): Promise<void>,

    finish(): Promise<void>
}

interface JaegerSpan extends TracerSpan {
    setTag(name: string, value: any): Promise<void>,
}

interface JaegerTracer {
    extract(key: string, headers: { [string]: any }): any,

    startSpan(name: string, options: {
        childOf: any,
    }): Promise<JaegerSpan>
}

const missingSpan: TracerSpan = {
    log(_options: { event: string, value: any }): Promise<void> {
        return Promise.resolve();
    },
    finish(): Promise<void> {
        return Promise.resolve();
    }
};

export class Tracer {
    jaeger: ?JaegerTracer;

    constructor(config: QConfig) {
        const endpoint = config.jaeger.endpoint;
        if (!endpoint) {
            this.jaeger = null;
            return;
        }
        this.jaeger = initJaegerTracer({
            serviceName: 'Q Server',
            sampler: {
                type: 'const',
                param: 1,
            },
            reporter: {
                collectorEndpoint: endpoint,
                logSpans: true,
            }
        }, {
            logger: {
                info(msg) {
                    console.log('INFO ', msg);
                },
                error(msg) {
                    console.log('ERROR', msg);
                },
            },
        });
    }

    getContext(req: any): any {
        let ctx_src, ctx_frm;
        if (req.headers) {
            ctx_src = req.headers;
            ctx_frm = FORMAT_TEXT_MAP;
        } else {
            ctx_src = req.context;
            ctx_frm = FORMAT_BINARY;
        }
        return this.jaeger ?
            {
                tracer_ctx: this.jaeger.extract(ctx_frm, ctx_src),
            }
            : {}
    }

    async startSpan(context: any, name: string): Promise<TracerSpan> {
        const jaeger = this.jaeger;
        if (!jaeger) {
            return missingSpan;
        }
        const span: JaegerSpan = await jaeger.startSpan(name, {
            childOf: context.tracer_ctx,
        });
        await span.setTag(Tags.SPAN_KIND, 'server');
        return span;
    }

    async startSpanLog(context: any, name: string, event: string, value: any): Promise<TracerSpan> {
        const jaeger = this.jaeger;
        if (!jaeger) {
            return missingSpan;
        }
        const span: JaegerSpan = await jaeger.startSpan(name, {
            childOf: context.tracer_ctx,
        });
        await span.setTag(Tags.SPAN_KIND, 'server');
        await span.log({
            event,
            value,
        });
        return span;
    }

}
