import { packageJson } from "../utils"
import { QRequestContext } from "../request"
import { FieldNode } from "graphql"

const { version } = packageJson()

type Info = {
    version?: string
    time?: number
    lastBlockTime?: number
    blocksLatency?: number
    transactionsLatency?: number
    messagesLatency?: number
    latency?: number
    endpoints?: string[]
    chainOrderBoundary?: string
    rempEnabled?: boolean
}

async function info(
    _parent: Record<string, unknown>,
    _args: unknown,
    context: QRequestContext,
    info: { fieldNodes: FieldNode[] },
): Promise<Info> {
    const fields = new Set<string>()
    for (const field of info.fieldNodes[0].selectionSet?.selections ?? []) {
        if (field.kind === "Field") {
            fields.add(field.name.value)
        }
    }
    const result: Info = {
        version: version as string,
        time: Date.now(),
        endpoints: context.services.config.endpoints,
    }
    if (fields.has("chainOrderBoundary")) {
        try {
            result.chainOrderBoundary = (
                await context.services.data.getReliableChainOrderUpperBoundary(
                    context,
                    false,
                )
            ).boundary
        } catch {
            // intentionally left blank
        }
    }
    const latencyFieldsSelected =
        fields.has("latency") ||
        fields.has("blocksLatency") ||
        fields.has("transactionsLatency") ||
        fields.has("messagesLatency") ||
        fields.has("lastBlockTime")
    if (latencyFieldsSelected) {
        const latency = await context.services.data.getLatency(context)
        result.lastBlockTime = latency.lastBlockTime
        result.blocksLatency = latency.blocks.latency
        result.transactionsLatency = latency.transactions.latency
        result.messagesLatency = latency.messages.latency
        result.latency = latency.latency
    }
    result.rempEnabled = context.services.config.remp.enabled
    return result
}

export const infoResolvers = {
    Query: {
        info,
    },
}
