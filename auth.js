import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import {
  EMAIL_PATTERN,
  consumeLoginToken,
  normalizeEmail,
} from "./app/lib/magic-link";

const handler = NextAuth({
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
      authorization: {
        params: {
          scope: "read:user",
        },
      },
    }),
    CredentialsProvider({
      id: "magic-link",
      name: "Email",
      credentials: {
        email: { type: "email" },
        token: { type: "text" },
      },
      async authorize(credentials) {
        const email = normalizeEmail(credentials?.email);
        if (!EMAIL_PATTERN.test(email)) return null;

        const valid = await consumeLoginToken(email, credentials?.token);
        return valid ? { id: `email:${email}`, email } : null;
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.githubAccessToken = account.access_token;
      }

      return token;
    },
  },
});

export { handler as GET, handler as POST };
