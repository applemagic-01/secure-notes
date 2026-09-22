import { SharedNotePage } from "@/components/app/sharing/shared-note-page";

interface SharePageProps {
    params: Promise<{
        token: string;
    }>;
}

export default async function SharePage({
    params,
}: SharePageProps) {
    const { token } = await params;

    return <SharedNotePage token={token} />;
}