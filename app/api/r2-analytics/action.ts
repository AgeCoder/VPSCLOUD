import { dblocal } from "@/lib/localdb";
import { settings } from "@/lib/localdb/schema";
import { inArray } from "drizzle-orm";

export async function getR2Credentials() {
    const keys = [
        "CLOUDFLARE_R2_ENDPOINT",
        "CLOUDFLARE_R2_ACCESS_KEY_ID",
        "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
        'CLOUDFLARE_R2_BUCKET_NAME'
    ];

    const result = await dblocal
        .select()
        .from(settings)
        .where(inArray(settings.key, keys));

    const settingMap = Object.fromEntries(result.map((r) => [r.key, r.value]));

    const endpoint = settingMap["CLOUDFLARE_R2_ENDPOINT"];
    const accessKeyId = settingMap["CLOUDFLARE_R2_ACCESS_KEY_ID"];
    const secretAccessKey = settingMap["CLOUDFLARE_R2_SECRET_ACCESS_KEY"];
    const bucketName = settingMap["CLOUDFLARE_R2_BUCKET_NAME"];

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName) {
        throw new Error("Missing one or more R2 credentials in settings table");
    }

    return { endpoint, accessKeyId, secretAccessKey, bucketName };
}


