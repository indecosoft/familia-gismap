import Koa from 'koa';

export async function log(ctx: Koa.Context, next: () => Promise<any>) {
    const start = Date.now();
    await next();
    console.log(`${ctx.method} ${ctx.url} - ${Date.now() - start}ms`);
}
