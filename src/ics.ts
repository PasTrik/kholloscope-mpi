import * as fs from 'fs';
import * as path from 'path';

export interface IcsEventOptions {
    title: string;
    description?: string;
    location?: string;
    start: Date;
    end: Date;
}

export class IcsCalendar {
    private events: IcsEventOptions[] = [];
    private prodId: string;
    private static readonly MAX_LINE_LENGTH = 75; // RFC 5545 §3.1 (en octets)

    constructor(prodId: string = "-//MonEntreprise//MonApplication//FR") {
        this.prodId = prodId;
    }

    /**
     * RFC 5545 (AAAA-MM-JJ-THH.MM.SSZ)
     */
    private formatDate(date: Date): string {
        return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    }

    /**
     * Découpe une ligne trop longue selon la RFC 5545 (line folding).
     * Chaque ligne physique ne doit pas dépasser 75 octets, et chaque
     * ligne de continuation doit commencer par une espace.
     */
    private foldLine(line: string): string {
        const maxLength = IcsCalendar.MAX_LINE_LENGTH;

        if (Buffer.byteLength(line, 'utf-8') <= maxLength) {
            return line;
        }

        const chunks: string[] = [];
        let current = '';
        let currentBytes = 0;

        for (const char of line) {
            const charBytes = Buffer.byteLength(char, 'utf-8');

            if (currentBytes + charBytes > maxLength) {
                chunks.push(current);
                current = '';
                currentBytes = 0;
            }

            current += char;
            currentBytes += charBytes;
        }

        if (current.length > 0) {
            chunks.push(current);
        }

        // La première ligne garde sa longueur max, les suivantes
        // sont préfixées par une espace (donc 74 caractères de contenu utile)
        return chunks
            .map((chunk, i) => (i === 0 ? chunk : ' ' + chunk))
            .join('\r\n');
    }

    public addEvent(event: IcsEventOptions): void {
        if (event.end <= event.start) {
            throw new Error(`L'événement "${event.title}" doit se terminer après sa date de début.`);
        }
        this.events.push(event);
    }

    public clearEvents(): void {
        this.events = [];
    }

    public build(): string {
        const now = new Date();
        const timestamp = this.formatDate(now);

        const rawLines: string[] = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            `PRODID:${this.prodId}`,
            "CALSCALE:GREGORIAN"
        ];

        this.events.forEach((event, index) => {
            const uid = `${timestamp}-${index}-${Math.random().toString(36).substring(2, 9)}@domaine.com`;

            rawLines.push("BEGIN:VEVENT");
            rawLines.push(`UID:${uid}`);
            rawLines.push(`DTSTAMP:${timestamp}`);
            rawLines.push(`DTSTART:${this.formatDate(event.start)}`);
            rawLines.push(`DTEND:${this.formatDate(event.end)}`);
            rawLines.push(`SUMMARY:${event.title}`);

            if (event.description) {
                const cleanDesc = event.description.replace(/\r?\n/g, "\\n");
                rawLines.push(`DESCRIPTION:${cleanDesc}`);
            }
            if (event.location) {
                rawLines.push(`LOCATION:${event.location}`);
            }

            rawLines.push("END:VEVENT");
        });

        rawLines.push("END:VCALENDAR");

        // On applique le folding ligne par ligne avant de joindre le tout
        return rawLines.map(line => this.foldLine(line)).join("\r\n");
    }

    public saveToFile(destinationPath: string): void {
        const content = this.build();

        const absoluteFilePath = path.resolve(destinationPath);
        const parentDirectory = path.dirname(absoluteFilePath);

        try {
            fs.mkdirSync(parentDirectory, { recursive: true });
            fs.writeFileSync(absoluteFilePath, content, 'utf-8');
            console.log(`💾 Fichier ICS sauvegardé avec succès à l'emplacement : ${absoluteFilePath}`);
        } catch (error) {
            console.error("❌ Erreur lors de la sauvegarde du fichier ICS :", error);
            throw error;
        }
    }
}