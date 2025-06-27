import * as nativeOpenCV from "@/native-modules/opencv";

export async function readQRCode(imageBase64: string): Promise<{ found: boolean; text: string }> {
    const result = await nativeOpenCV.readQRCode(imageBase64);

    return {
        found: result.found,
        text: result.text,
    };
}
