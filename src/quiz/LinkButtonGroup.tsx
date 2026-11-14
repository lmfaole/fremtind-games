// Jøkul 6.1.0-next.7 har ingen "use client"-direktiver (se docs/jokul.md).
"use client";
import { Button } from "@fremtind/jokul/button";
import { Flex } from "@fremtind/jokul/flex";

interface LinkAction {
    href: string;
    label: string;
}

/**
 * Som Jøkuls `ButtonGroup`, men med lenker (`Button as="a"`). `ButtonGroup` er typet bare for
 * `button`, og navigasjon skal være ekte lenker, ikke `onClick` med `router.push`.
 */
export const LinkButtonGroup = ({
    main,
    secondary,
    className,
}: {
    main: LinkAction;
    secondary?: LinkAction;
    className?: string;
}) => (
    <Flex
        className={className ? `jkl-button-group ${className}` : "jkl-button-group"}
        direction="column"
        alignItems="center"
        gap="8"
    >
        <Button as="a" href={main.href} variant="primary">
            {main.label}
        </Button>
        {secondary && (
            <Button as="a" href={secondary.href} variant="ghost">
                {secondary.label}
            </Button>
        )}
    </Flex>
);
