import { GET as authGet, POST as authPost } from "../../../../auth";

// Next 16 daje params kao Promise, a next-auth v4 očekuje običan objekat.
async function withResolvedParams(handler, request, context) {
  return handler(request, { params: await context.params });
}

export const GET = (request, context) =>
  withResolvedParams(authGet, request, context);
export const POST = (request, context) =>
  withResolvedParams(authPost, request, context);
