declare namespace Deno {
    namespace env {
      function get(key: string): string | undefined;
    }
    function serve(
      handler: (request: Request) => Response | Promise<Response>
    ): void;
  }
  
  declare module "https://esm.sh/@supabase/supabase-js@2" {
    export function createClient(
      supabaseUrl: string,
      supabaseKey: string,
      options?: Record<string, unknown>
    ): {
      rpc(
        fn: string,
        params: Record<string, unknown>
      ): Promise<{ data: unknown; error: { message: string } | null }>;
    };
  }