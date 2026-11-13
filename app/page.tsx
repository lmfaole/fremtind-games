// Jøkul 6.1.0-next.7 har ingen "use client"-direktiver, så komponentene kan ikke
// rendres i en Server Component.
"use client";
import { Button } from "@fremtind/jokul/button";
import { Card } from "@fremtind/jokul/card";
import { Flex } from "@fremtind/jokul/flex";
import { Select } from "@fremtind/jokul/select";
import { Text, Title } from "@fremtind/jokul/typography";
import { useEffect, useState } from "react";
import { brands, readBrand, setBrand } from "@/brand";
import styles from "./page.module.scss";

const Home = () => {
    const [brand, setBrandState] = useState("");

    useEffect(() => setBrandState(readBrand()), []);

    return (
        <main className={styles.hero} data-theme="dark">
            <Card padding="xl" className={styles.card}>
                <Flex direction="column" gap="l">
                    <Title as="h1" size="xl">
                        Norge og Sverige
                    </Title>
                    <Text size="l">
                        Hvor godt kjenner du naboen? Test deg på popkultur, historie, teknologi og alt annet som binder Norge og Sverige sammen.
                    </Text>
                    <Select
                        label="Velg tema"
                        width="100%"
                        value={brand}
                        items={brands.map(({ value, label }) => ({ value, label }))}
                        onChange={(event) => {
                            setBrandState(event.target.value);
                            setBrand(event.target.value);
                        }}
                    />
                    <Flex>
                        <Button variant="primary" as="a" href="/quiz/1/">
                            Start quizen
                        </Button>
                    </Flex>
                </Flex>
            </Card>
        </main>
    );
};

export default Home;
