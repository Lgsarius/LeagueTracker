export async function GET() {
  return new Response('proof=9ada6d2a-0cb6-4f1f-bebd-dd5f7fe2f37b', {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
} 