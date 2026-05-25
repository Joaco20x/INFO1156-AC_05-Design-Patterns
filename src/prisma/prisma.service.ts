import { PrismaLibSql } from "@prisma/adapter-libsql"
import { PrismaClient } from "@prisma/client"

import { Injectable, OnModuleInit } from "@nestjs/common"

const DATABASE_URL = "file:./sqlite.db"

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor() {
        const adapter = new PrismaLibSql({ url: DATABASE_URL })

        super({ adapter })
    }

    async onModuleInit() {
        await this.$connect()
    }
}
