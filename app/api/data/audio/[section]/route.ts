import { NextResponse } from 'next/server';
import { sectionToSpeech } from "../../../scripts/text-to-audio";

export const maxDuration = 60;

export async function POST(request: Request) {
    try {
        const { section, sectionKey, rowId } = await request.json();
        await sectionToSpeech(section, sectionKey, rowId);
        return NextResponse.json({ message: 'Section to speech conversion completed successfully' });
    } catch (error) {
        console.error('Error during section to speech conversion:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message: 'Error occurred during section to speech conversion', error: errorMessage }, { status: 500 });
    }
}

