import type { NextAuthConfig } from "next-auth";

// 这个配置文件只包含不依赖 Prisma 的配置
// 可以安全地在 Edge Runtime (middleware) 中使用
export const authConfig = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
    newUser: "/auth/register",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAuthPage = nextUrl.pathname.startsWith("/auth");
      const isOnProtectedRoute =
        nextUrl.pathname.startsWith("/articleList") ||
        nextUrl.pathname.startsWith("/api/user");

      if (isOnProtectedRoute) {
        if (isLoggedIn) return true;
        return false; // 重定向到登录页
      } else if (isOnAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      return true;
    },
  },
  providers: [], // 在 auth.ts 中添加 providers
} satisfies NextAuthConfig;
