/* eslint-disable @typescript-eslint/no-explicit-any */
declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
};

declare module "https://deno.land/std@0.190.0/http/server.ts" {
  export function serve(
    handler: (req: Request) => Response | Promise<Response>
  ): void;
}

declare module "https://esm.sh/resend@4.0.0" {
  export class Resend {
    constructor(apiKey?: string);
    emails: { send(args: any): Promise<any> };
  }
  export default Resend;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient(...args: any[]): any;
}

declare module "https://esm.sh/*" {
  const v: any;
  export default v;
}
declare module "https://deno.land/*" {
  const v: any;
  export default v;
}
