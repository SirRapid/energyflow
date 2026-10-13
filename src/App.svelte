<script lang="ts">
  import { setFileBankActions } from "./lib/fileBankContext";
  import "@xyflow/svelte/dist/style.css";
  import "./app.css";
  import PropertyList from "./lib/screens/PropertyList.svelte";
  import NewProperty from "./lib/screens/NewProperty.svelte";
  import Canvas from "./lib/screens/Canvas.svelte";
  import { properties as initialProperties, templates } from "./lib/catalog";
  import type { Flow, Property, Template, BankFile } from "./lib/types";

  let properties = $state.raw<Property[]>(structuredClone(initialProperties));
  let screen = $state<"properties" | "new" | "canvas">("properties");
  let activeId = $state<string | null>(null);
  let activeProperty = $derived(
    properties.find((property) => property.id === activeId),
  );
  let availableTemplates = $derived<Template[]>([
    ...templates,
    ...properties.map((property) => ({
      id: `property-${property.id}`,
      name: property.name,
      source: "My flows" as const,
      flow: property.flow,
    })),
  ]);

  let clipboard = $state.raw<File | null>(null);

  setFileBankActions({
    get clipboard() {
      return clipboard;
    },
    copy(file) {
      clipboard = file;
    },
    destinations: () =>
      properties
        .filter((property) => property.id !== activeId)
        .map(({ id, name }) => ({ id, name })),
    transfer(destinationId, entry) {
      const destination = properties.find(
        (property) => property.id === destinationId,
      );
      if (!destination || destination.id === activeId) return false;
      const flow = structuredClone(destination.flow);
      const bank = flow.nodes.find((node) => node.type === "fileBank");
      const transferred: BankFile = {
        ...entry,
        id: crypto.randomUUID(),
        addedAt: new Date().toISOString(),
      };
      if (bank) {
        bank.data = {
          ...bank.data,
          files: [...((bank.data.files ?? []) as BankFile[]), transferred],
        };
      } else {
        flow.nodes.push({
          id: crypto.randomUUID(),
          type: "fileBank",
          width: 560,
          height: 320,
          position: { x: 100, y: 100 },
          data: {
            label: "Transferred files",
            definitionId: "file-bank",
            files: [transferred],
          },
        });
      }
      properties = properties.map((property) =>
        property.id === destinationId ? { ...property, flow } : property,
      );
      return true;
    },
  });

  function openProperty(id: string) {
    activeId = id;
    screen = "canvas";
  }

  function createProperty(name: string, template: Template) {
    const property = {
      id: crypto.randomUUID(),
      name,
      flow: structuredClone(template.flow),
    };
    properties = [...properties, property];
    openProperty(property.id);
  }

  function leaveCanvas(flow: Flow) {
    properties = properties.map((property) =>
      property.id === activeId
        ? { ...property, flow: structuredClone(flow) }
        : property,
    );
    activeId = null;
    screen = "properties";
  }
</script>

{#if screen === "properties"}
  <PropertyList
    {properties}
    onopen={openProperty}
    onnew={() => (screen = "new")}
  />
{:else if screen === "new"}
  <NewProperty
    templates={availableTemplates}
    oncreate={createProperty}
    onback={() => (screen = "properties")}
  />
{:else if activeProperty}
  {#key activeProperty.id}
    <Canvas
      name={activeProperty.name}
      flow={activeProperty.flow}
      onback={leaveCanvas}
    />
  {/key}
{/if}
