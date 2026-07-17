import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

import { colors } from "@/src/theme/tokens";

/**
 * Web document shell. Forces light color-scheme so UA dark mode does not
 * recolor form controls (see Field TextInput background + T0.3).
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta name="color-scheme" content="light" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `:root { color-scheme: light; } input, textarea, select { color-scheme: light; background-color: ${colors.surface}; color: ${colors.ink}; }`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
