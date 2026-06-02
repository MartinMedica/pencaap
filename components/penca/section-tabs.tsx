"use client";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AppTab } from "./types";

const tabs: AppTab[] = ["predicciones", "ranking", "admin"];

type SectionTabsProps = {
  activeTab: AppTab;
  isAdmin: boolean;
  onChange: (tab: AppTab) => void;
};

export function SectionTabs({ activeTab, isAdmin, onChange }: SectionTabsProps) {
  return (
    <TabsList>
      {tabs.map((tab) => (
        <TabsTrigger
          key={tab}
          active={activeTab === tab}
          className={tab === "admin" && !isAdmin ? "hidden" : undefined}
          onClick={() => onChange(tab)}
        >
          {tab}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
