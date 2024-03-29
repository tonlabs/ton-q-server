import { makeFieldTypeName } from "../../maintanance/gen-graphql/gen"
import { Def, parseTypeDef, TypeDef } from "./schema-def"
import type {
    DbJoin,
    IntEnumDef,
    IntEnumValues,
    IntFlags,
    IntFlagsDef,
    IntSizeType,
    SchemaDoc,
    SchemaMember,
    SchemaType,
} from "./schema"
import { SchemaSubType, ToStringFormatter } from "./schema"

const { ref, arrayOf } = Def

export const join = (
    refDef: string | { [name: string]: TypeDef },
    on: string,
    refOn: string,
    preCondition?: string,
): TypeDef => {
    return {
        ...ref(refDef),
        _: {
            join: {
                collection: "",
                on,
                refOn,
                preCondition,
            },
        },
    }
}

export const withDoc = (def: TypeDef, doc?: string): TypeDef => ({
    ...def,
    ...(doc ? { _doc: doc } : {}),
})

export const required = (def: TypeDef) => def

const uint = (size: IntSizeType, doc?: string) =>
    withDoc(
        {
            _int: {
                unsigned: true,
                size,
            },
        },
        doc,
    )

const int = (size: IntSizeType, doc?: string) =>
    withDoc(
        {
            _int: {
                unsigned: false,
                size,
            },
        },
        doc,
    )

export const i8 = (doc?: string) => int(8, doc)
export const i32 = (doc?: string) => int(32, doc)
export const u8 = (doc?: string) => uint(8, doc)
export const u16 = (doc?: string) => uint(16, doc)
export const u32 = (doc?: string) => uint(32, doc)
export const u64 = (doc?: string) => uint(64, doc)
export const u128 = (doc?: string) => uint(128, doc)
const u256 = (doc?: string) => uint(256, doc)

export const u32WithFormatter = (formatter: ToStringFormatter, doc?: string) =>
    withDoc(
        {
            _int: {
                unsigned: true,
                size: 32,
            },
            _: {
                formatter,
            },
        },
        doc,
    )

export const stringWithLowerFilter = (doc?: string) =>
    withDoc(
        {
            _string: {},
            _: {
                lowerFilter: true,
            },
        },
        doc,
    )

export const unixSeconds = (doc?: string) =>
    u32WithFormatter(ToStringFormatter.unixSecondsToString, doc)

export const grams = u128

export function u8enum(name: string, values: IntEnumValues) {
    return (doc?: string): TypeDef => {
        const valuesDoc = Object.entries(values)
            .map(([name, value]) => {
                return `- ${value} – ${name}`
            })
            .join("\n")
        const effectiveDoc = `${doc ? `${doc}\n` : ""}${valuesDoc}`
        return withDoc(
            {
                _int: {
                    unsigned: true,
                    size: 8,
                },
                _: {
                    enum: {
                        name,
                        values,
                    },
                },
            },
            effectiveDoc,
        )
    }
}

export function u64flags(name: string, values: IntFlags) {
    return (doc?: string): TypeDef => {
        const valuesDoc = Object.entries(values)
            .map(([name, value]) => {
                return `- 0x${value.toString(16)} – ${name}`
            })
            .join("\n")
        const effectiveDoc = `${doc ? `${doc}\n` : ""}${valuesDoc}`
        return withDoc(
            {
                _int: {
                    unsigned: true,
                    size: 64,
                },
                _: {
                    flags: {
                        name,
                        values,
                    },
                },
            },
            effectiveDoc,
        )
    }
}

export const OtherCurrency = {
    currency: u32(),
    value: u256(),
}

export const otherCurrencyCollection = (doc?: string): TypeDef =>
    arrayOf(ref({ OtherCurrency }), doc)

export enum DbTypeCategory {
    unresolved = "unresolved",
    scalar = "scalar",
    union = "union",
    struct = "struct",
}

export type DbType = {
    name: string
    fields: DbField[]
    category: DbTypeCategory
    collection?: string
    doc: string
}

export type DbField = {
    name: string
    type: DbType
    arrayDepth: number
    join?: DbJoin
    enumDef?: IntEnumDef
    flagsDef?: IntFlagsDef
    formatter?: ToStringFormatter
    lowerFilter?: boolean
    subType?: SchemaSubType
    doc: string
}

function scalarType(name: string): DbType {
    return {
        name,
        category: DbTypeCategory.scalar,
        fields: [],
        doc: "",
    }
}

export const scalarTypes = {
    int: scalarType("Int"),
    uint64: scalarType("String"),
    uint1024: scalarType("String"),
    float: scalarType("Float"),
    boolean: scalarType("Boolean"),
    string: scalarType("String"),
}

export function isBigInt(field: DbField): boolean {
    return (
        field.type === scalarTypes.uint1024 || field.type === scalarTypes.uint64
    )
}

export function isAddress(field: DbField): boolean {
    return (
        field.type === scalarTypes.string &&
        (field.subType ?? SchemaSubType.NONE) === SchemaSubType.ADDRESS
    )
}

export function unresolvedType(name: string): DbType {
    return {
        name,
        category: DbTypeCategory.unresolved,
        fields: [],
        doc: "",
    }
}

export function toEnumStyle(s: string): string {
    return `${s.substr(0, 1).toUpperCase()}${s.substr(1)}`
}

export function stringifyEnumValues(values: {
    [name: string]: number
}): string {
    const fields = Object.entries(values).map(([name, value]) => {
        return `${toEnumStyle(name)}: ${value}`
    })
    return `{ ${fields.join(", ")} }`
}

export function stringifyFlagsValues(values: {
    [name: string]: number
}): string {
    const fields = Object.entries(values).map(([name, value]) => {
        return `${name}: ${value}`
    })
    return `{ ${fields.join(", ")} }`
}

export function getDocMD(doc?: SchemaDoc): string {
    if (!doc) {
        return ""
    }
    if (typeof doc === "string") {
        return doc
    }
    if ("md" in doc) {
        return doc.md
    }
    return ""
}

export type DbSchema = {
    types: DbType[]
    enumTypes: Map<string, IntEnumDef>
    flagsTypes: Map<string, IntFlagsDef>
}

export function parseDbSchema(schemaDef: TypeDef): DbSchema {
    const dbTypes: DbType[] = []
    const enumTypes: Map<string, IntEnumDef> = new Map()
    const flagsTypes: Map<string, IntFlagsDef> = new Map()

    function parseDbField(
        typeName: string,
        schemaField: SchemaMember<SchemaType>,
    ): DbField {
        let schemaType: SchemaType = schemaField
        const field: DbField = {
            name: schemaField.name,
            arrayDepth: 0,
            type: scalarTypes.string,
            doc: getDocMD(schemaField.doc),
        }
        while (schemaType.array) {
            field.arrayDepth += 1
            schemaType = schemaType.array
        }
        const ex = schemaType._
        const enumDef: IntEnumDef | null = (ex && ex.enum) || null
        if (enumDef) {
            field.enumDef = enumDef
            enumTypes.set(enumDef.name, enumDef)
        }
        const flagsDef: IntFlagsDef | null = (ex && ex.flags) || null
        if (flagsDef) {
            field.flagsDef = flagsDef
            flagsTypes.set(flagsDef.name, flagsDef)
        }
        const join = ex && ex.join
        if (join) {
            field.join = join
        }
        if (ex && ex.formatter) {
            field.formatter = ex.formatter
        }
        if (schemaType.union || schemaType.struct) {
            field.type = unresolvedType(
                makeFieldTypeName(typeName, schemaField.name),
            )
        } else if (schemaType.ref) {
            field.type = unresolvedType(schemaType.ref.name)
        } else if (schemaType.bool) {
            field.type = scalarTypes.boolean
        } else if (schemaType.int) {
            const unsigned: boolean =
                (schemaType.int && schemaType.int.unsigned) || false
            const size: number = (schemaType.int && schemaType.int.size) || 32
            if (unsigned) {
                if (size >= 128) {
                    field.type = scalarTypes.uint1024
                } else if (size >= 64) {
                    field.type = scalarTypes.uint64
                } else if (size >= 32) {
                    field.type = scalarTypes.float
                } else {
                    field.type = scalarTypes.int
                }
            } else {
                if (size > 32) {
                    throw new Error(
                        `Integer type with size ${size} bit does not supported`,
                    )
                } else {
                    field.type = scalarTypes.int
                }
            }
        } else if (schemaType.float) {
            field.type = scalarTypes.float
        } else if (schemaType.string) {
            field.type = scalarTypes.string
            if (ex && ex.lowerFilter) {
                field.lowerFilter = true
            }
            field.subType = schemaType.string.subType
        } else {
            field.type = scalarTypes.string
            console.log("Invalid field type: ", JSON.stringify(schemaType))
            process.exit(1)
        }
        return field
    }

    function unwrapArrays(type: SchemaType): SchemaType {
        if (type.array) {
            return unwrapArrays(type.array)
        }
        return type
    }

    function parseDbType(name: string, schemaType: SchemaType) {
        const struct = schemaType.union || schemaType.struct
        if (!struct) {
            console.log(
                `?? ${name}: ${JSON.stringify(schemaType).substr(0, 200)}`,
            )
            return
        }
        const type: DbType = {
            name,
            category: schemaType.union
                ? DbTypeCategory.union
                : DbTypeCategory.struct,
            fields: [],
            collection: schemaType._?.collection,
            doc: getDocMD(schemaType.doc),
        }

        if (type.collection && !struct.find(x => x.name === "id")) {
            type.fields.push({
                name: "id",
                arrayDepth: 0,
                type: scalarTypes.string,
                lowerFilter: true,
                doc: "",
            })
        }
        struct.forEach(field => {
            type.fields.push(parseDbField(name, field))
            const unwrapped = unwrapArrays(field)
            const ownType =
                unwrapped.struct || unwrapped.union ? unwrapped : null
            if (ownType) {
                parseDbType(makeFieldTypeName(name, field.name), ownType)
            }
        })
        dbTypes.push(type)
    }

    const schema = parseTypeDef(schemaDef)

    if (schema.class) {
        schema.class.types.forEach((type: SchemaMember<SchemaType>) => {
            parseDbType(type.name, type)
        })
    }

    const unresolved: Map<string, DbType> = new Map<string, DbType>()
    const resolving: Set<string> = new Set<string>()
    const resolved: Map<string, DbType> = new Map<string, DbType>()
    const orderedResolved: DbType[] = []
    dbTypes.forEach(t => unresolved.set(t.name, t))
    const resolveType = (type: DbType) => {
        if (resolved.has(type.name)) {
            return
        }
        if (resolving.has(type.name)) {
            console.log(`WARNING: Circular reference to type ${type.name}`)
            return
        }
        resolving.add(type.name)
        type.fields.forEach(field => {
            if (field.type.category === DbTypeCategory.unresolved) {
                let type = resolved.get(field.type.name)
                if (!type) {
                    type = unresolved.get(field.type.name)
                    if (type) {
                        resolveType(type)
                    } else {
                        console.log(
                            `Referenced type not found: ${field.type.name}`,
                        )
                        process.exit(1)
                    }
                }
                if (type) {
                    field.type = type
                }
            }
        })
        resolving.delete(type.name)
        orderedResolved.push(type)
        unresolved.delete(type.name)
        resolved.set(type.name, type)
    }
    dbTypes.forEach(resolveType)

    function compareCollections(a: DbType, b: DbType): number {
        if (a.collection) {
            if (b.collection) {
                return dbTypes.findIndex(value => value === a) >
                    dbTypes.findIndex(value => value === b)
                    ? 1
                    : -1
            } else {
                return 1
            }
        } else if (b.collection) {
            return -1
        } else {
            return 0
        }
    }

    orderedResolved.sort(compareCollections)
    return {
        types: orderedResolved,
        enumTypes,
        flagsTypes,
    }
}
