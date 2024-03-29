import { GraphQLResolveInfo } from "graphql"

import { convertBigUInt, QParams } from "../../../filter/filters"
import { QRequestContext } from "../../../request"
import { QTraceSpan } from "../../../tracing"
import { required } from "../../../utils"

import { config } from "../config"
import {
    stringCursor,
    Direction,
    getNodeSelectionSetForConnection,
    isDefined,
    prepareChainOrderFilter,
    prepareNonChainOrderPaginationFilter,
    processPaginatedQueryResult,
    processPaginationArgs,
    u64StringCursor,
} from "../helpers"
import {
    BlockchainAccountQueryTransactions_By_LtArgs,
    BlockchainAccountQueryTransactionsArgs,
    BlockchainQueryTransactions_By_In_MsgArgs,
    BlockchainQueryTransactionsArgs,
    BlockchainTransaction,
    BlockchainTransactionsConnection,
} from "../resolvers-types-generated"
import {
    parseTransactionBocsIfRequired,
    transactionArchiveFields,
    upgradeSelectionForBocParsing,
} from "../boc-parsers"
import { useTransactionsArchive } from "../../../data/data-provider"

export async function resolve_transaction(
    hash: String,
    context: QRequestContext,
    info: GraphQLResolveInfo,
    traceSpan: QTraceSpan,
    archive: boolean | undefined | null,
) {
    const maxJoinDepth = 2

    const useArchive = useTransactionsArchive(archive, context)
    const { selectionSet, requireBocParsing } = upgradeSelectionForBocParsing(
        useArchive,
        info.fieldNodes[0].selectionSet,
        transactionArchiveFields,
    )

    const returnExpression = config.transactions.buildReturnExpression(
        selectionSet,
        context,
        maxJoinDepth,
        "doc",
    )

    // query
    const params = new QParams({
        stringifyKeyInAqlComparison:
            context.services.config.queries.filter.stringifyKeyInAqlComparison,
    })
    const query =
        "FOR doc IN transactions " +
        `FILTER doc._key == @${params.add(hash)} ` +
        `RETURN ${returnExpression}`
    const queryResult = await parseTransactionBocsIfRequired(
        requireBocParsing,
        context,
        (await context.services.data.query(
            required(context.services.data.transactions.provider),
            {
                text: query,
                vars: params.values,
                orderBy: [],
                request: context,
                traceSpan,
                archive: useArchive,
            },
        )) as BlockchainTransaction[],
    )

    return queryResult[0]
}

export async function resolve_transactions_by_in_msg(
    args: BlockchainQueryTransactions_By_In_MsgArgs,
    context: QRequestContext,
    info: GraphQLResolveInfo,
    traceSpan: QTraceSpan,
) {
    const maxJoinDepth = 2

    const useArchive = useTransactionsArchive(args.archive, context)
    const { selectionSet, requireBocParsing } = upgradeSelectionForBocParsing(
        useArchive,
        info.fieldNodes[0].selectionSet,
        transactionArchiveFields,
    )

    const returnExpression = config.transactions.buildReturnExpression(
        selectionSet,
        context,
        maxJoinDepth,
        "doc",
    )

    // query
    const params = new QParams({
        stringifyKeyInAqlComparison:
            context.services.config.queries.filter.stringifyKeyInAqlComparison,
    })
    const query =
        "FOR doc IN transactions " +
        `FILTER doc.in_msg == @${params.add(args.msg_hash)} ` +
        "SORT doc.lt ASC LIMIT 50 " +
        `RETURN ${returnExpression}`
    const queryResult = await parseTransactionBocsIfRequired(
        requireBocParsing,
        context,
        (await context.services.data.query(
            required(context.services.data.transactions.provider),
            {
                text: query,
                vars: params.values,
                orderBy: [],
                request: context,
                traceSpan,
                archive: useArchive,
            },
        )) as BlockchainTransaction[],
    )
    return queryResult
}

export async function resolve_blockchain_transactions(
    args: BlockchainQueryTransactionsArgs,
    context: QRequestContext,
    info: GraphQLResolveInfo,
    traceSpan: QTraceSpan,
) {
    const maxJoinDepth = 2

    // filters
    const filters: string[] = []
    const params = new QParams({
        stringifyKeyInAqlComparison:
            context.services.config.queries.filter.stringifyKeyInAqlComparison,
    })
    const useArchive = useTransactionsArchive(args.archive, context)

    await prepareChainOrderFilter(args, params, filters, context, useArchive)

    if (isDefined(args.workchain)) {
        filters.push(`doc.workchain_id == @${params.add(args.workchain)}`)
    }
    if (isDefined(args.code_hash)) {
        filters.push(`doc.code_hash == @${params.add(args.code_hash)}`)
    }
    if (isDefined(args.min_balance_delta)) {
        const min_balance_delta = convertBigUInt(2, args.min_balance_delta)
        filters.push(`doc.balance_delta >= @${params.add(min_balance_delta)}`)
    }
    if (isDefined(args.max_balance_delta)) {
        const max_balance_delta = convertBigUInt(2, args.max_balance_delta)
        filters.push(`doc.balance_delta <= @${params.add(max_balance_delta)}`)
    }

    const { direction, limit } = processPaginationArgs(args)

    const { selectionSet, requireBocParsing } = upgradeSelectionForBocParsing(
        useArchive,
        getNodeSelectionSetForConnection(info),
        transactionArchiveFields,
    )
    const returnExpression = config.transactions.buildReturnExpression(
        selectionSet,
        context,
        maxJoinDepth,
        "doc",
    )

    // query
    const query = `
        FOR doc IN transactions
        FILTER ${filters.join(" AND ")}
        SORT doc.chain_order ${direction == Direction.Backward ? "DESC" : "ASC"}
        LIMIT ${limit}
        RETURN ${returnExpression}
    `
    const queryResult = await parseTransactionBocsIfRequired(
        requireBocParsing,
        context,
        (await context.services.data.query(
            required(context.services.data.transactions.provider),
            {
                text: query,
                vars: params.values,
                orderBy: [
                    {
                        path: "chain_order",
                        direction: "ASC",
                    },
                ],
                request: context,
                traceSpan,
                archive: useArchive,
            },
        )) as BlockchainTransaction[],
    )

    return (await processPaginatedQueryResult(
        queryResult,
        limit,
        direction,
        "chain_order",
        stringCursor,
        async r => {
            await config.transactions.fetchJoins(
                r,
                selectionSet,
                context,
                traceSpan,
                maxJoinDepth,
                useArchive,
            )
        },
    )) as BlockchainTransactionsConnection
}

export async function resolve_account_transactions(
    account_address: string,
    args: BlockchainAccountQueryTransactionsArgs,
    context: QRequestContext,
    info: GraphQLResolveInfo,
    traceSpan: QTraceSpan,
) {
    const maxJoinDepth = 2
    // filters
    const filters: string[] = []
    const params = new QParams({
        stringifyKeyInAqlComparison:
            context.services.config.queries.filter.stringifyKeyInAqlComparison,
    })

    const useArchive = useTransactionsArchive(args.archive, context)
    await prepareChainOrderFilter(args, params, filters, context, useArchive)
    filters.push(`doc.account_addr == @${params.add(account_address)}`)
    if (isDefined(args.aborted)) {
        filters.push(`doc.aborted == @${params.add(args.aborted)}`)
    }
    if (isDefined(args.min_balance_delta)) {
        const min_balance_delta = convertBigUInt(2, args.min_balance_delta)
        filters.push(`doc.balance_delta >= @${params.add(min_balance_delta)}`)
    }
    if (isDefined(args.max_balance_delta)) {
        const max_balance_delta = convertBigUInt(2, args.max_balance_delta)
        filters.push(`doc.balance_delta <= @${params.add(max_balance_delta)}`)
    }

    const { direction, limit } = processPaginationArgs(args)

    const { selectionSet, requireBocParsing } = upgradeSelectionForBocParsing(
        useArchive,
        getNodeSelectionSetForConnection(info),
        transactionArchiveFields,
    )
    const returnExpression = config.transactions.buildReturnExpression(
        selectionSet,
        context,
        maxJoinDepth,
        "doc",
    )

    // query
    const query = `
        FOR doc IN transactions
        FILTER ${filters.join(" AND ")}
        SORT doc.chain_order ${direction == Direction.Backward ? "DESC" : "ASC"}
        LIMIT ${limit}
        RETURN ${returnExpression}
    `
    const queryResult = await parseTransactionBocsIfRequired(
        requireBocParsing,
        context,
        (await context.services.data.query(
            required(context.services.data.transactions.provider),
            {
                text: query,
                vars: params.values,
                orderBy: [
                    {
                        path: "chain_order",
                        direction: "ASC",
                    },
                ],
                request: context,
                traceSpan,
                archive: useArchive,
            },
        )) as BlockchainTransaction[],
    )

    return (await processPaginatedQueryResult(
        queryResult,
        limit,
        direction,
        "chain_order",
        stringCursor,
        async r => {
            await config.transactions.fetchJoins(
                r,
                selectionSet,
                context,
                traceSpan,
                maxJoinDepth,
                useArchive,
            )
        },
    )) as BlockchainTransactionsConnection
}

export async function resolve_account_transactions_by_lt(
    account_address: string,
    args: BlockchainAccountQueryTransactions_By_LtArgs,
    context: QRequestContext,
    info: GraphQLResolveInfo,
    traceSpan: QTraceSpan,
) {
    const maxJoinDepth = 2
    // filters
    const filters: string[] = []
    const params = new QParams({
        stringifyKeyInAqlComparison:
            context.services.config.queries.filter.stringifyKeyInAqlComparison,
    })

    const useArchive = useTransactionsArchive(args.archive, context)
    await prepareNonChainOrderPaginationFilter(
        args,
        params,
        filters,
        context,
        useArchive,
        "lt",
        u64StringCursor,
    )
    filters.push(`doc.account_addr == @${params.add(account_address)}`)

    const { direction, limit } = processPaginationArgs(args)

    const { selectionSet, requireBocParsing } = upgradeSelectionForBocParsing(
        useArchive,
        getNodeSelectionSetForConnection(info),
        transactionArchiveFields,
    )

    const returnExpression = config.transactions.buildReturnExpression(
        selectionSet,
        context,
        maxJoinDepth,
        "doc",
        ["lt"],
    )

    // query
    const query = `
        FOR doc IN transactions
        FILTER ${filters.join(" AND ")}
        SORT doc.lt ${direction == Direction.Backward ? "DESC" : "ASC"}
        LIMIT ${limit}
        RETURN ${returnExpression}
    `
    const queryResult = await parseTransactionBocsIfRequired(
        requireBocParsing,
        context,
        (await context.services.data.query(
            required(context.services.data.transactions.provider),
            {
                text: query,
                vars: params.values,
                orderBy: [
                    {
                        path: "lt",
                        direction: "ASC",
                    },
                ],
                request: context,
                traceSpan,
                archive: useArchive,
            },
        )) as BlockchainTransaction[],
    )

    return (await processPaginatedQueryResult(
        queryResult,
        limit,
        direction,
        "lt",
        u64StringCursor,
        async r => {
            await config.transactions.fetchJoins(
                r,
                selectionSet,
                context,
                traceSpan,
                maxJoinDepth,
                useArchive,
            )
        },
    )) as BlockchainTransactionsConnection
}
