"use client";

import { saveContentBlock } from "@/actions/content-blocks";
import { ContentHrefField } from "@/components/admin/content-href-field";
import { useToast } from "@/components/ui/toast";
import {
  FLOW_START,
  flowNodes as defaultFlowNodes,
  parseChatbotFlowJson,
  type FlowChoice,
  type FlowNode,
} from "@/components/site/chatbot/flow";
import type { MenuLinkOption } from "@/lib/queries/menus";
import { useMemo, useState } from "react";

const fieldClassName =
  "w-full rounded-default border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";

type EditableNodes = Record<string, FlowNode>;

function cloneDefaults(): EditableNodes {
  return structuredClone(defaultFlowNodes);
}

function loadNodes(raw: string): EditableNodes {
  return parseChatbotFlowJson(raw) ?? cloneDefaults();
}

function isLinkChoice(
  choice: FlowChoice,
): choice is Extract<FlowChoice, { href: string }> {
  return "href" in choice;
}

export function ChatbotFlowEditor({
  initialJson,
  linkOptions,
}: {
  initialJson: string;
  linkOptions: MenuLinkOption[];
}) {
  const { toast } = useToast();
  const [nodes, setNodes] = useState<EditableNodes>(() =>
    loadNodes(initialJson),
  );
  const [selectedId, setSelectedId] = useState(() => {
    const loaded = loadNodes(initialJson);
    return loaded[FLOW_START] ? FLOW_START : Object.keys(loaded)[0] ?? "";
  });
  const [saving, setSaving] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [rawDraft, setRawDraft] = useState("");

  const nodeIds = useMemo(() => Object.keys(nodes).sort(), [nodes]);
  const selected = selectedId ? nodes[selectedId] : undefined;

  function updateNode(id: string, next: FlowNode) {
    setNodes((current) => ({ ...current, [id]: next }));
  }

  function addNode() {
    const base = `node_${Math.random().toString(36).slice(2, 7)}`;
    const id = nodes[base] ? `${base}_${Date.now()}` : base;
    const node: FlowNode = {
      id,
      kind: "question",
      messages: ["New message"],
      choices: [],
    };
    setNodes((current) => ({ ...current, [id]: node }));
    setSelectedId(id);
  }

  function removeNode(id: string) {
    if (id === FLOW_START) {
      toast("Keep the greeting node — rename its copy instead.", "error");
      return;
    }
    setNodes((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    if (selectedId === id) {
      setSelectedId(FLOW_START);
    }
  }

  async function handleSave() {
    setSaving(true);
    const result = await saveContentBlock({
      key: "global.chatbot.flow_json",
      type: "text",
      text: JSON.stringify(nodes, null, 2),
    });
    setSaving(false);
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    toast("Chatbot flow saved");
  }

  function handleResetToDefaults() {
    if (
      !window.confirm(
        "Reset the editor to the built-in chatbot flow? Unsaved changes will be lost.",
      )
    ) {
      return;
    }
    const defaults = cloneDefaults();
    setNodes(defaults);
    setSelectedId(FLOW_START);
  }

  async function handleClearCustom() {
    if (
      !window.confirm(
        "Clear the CMS override so the live site uses the code defaults?",
      )
    ) {
      return;
    }
    setSaving(true);
    const result = await saveContentBlock({
      key: "global.chatbot.flow_json",
      type: "text",
      text: "",
    });
    setSaving(false);
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    const defaults = cloneDefaults();
    setNodes(defaults);
    setSelectedId(FLOW_START);
    toast("Using built-in chatbot flow");
  }

  function applyRaw() {
    const parsed = parseChatbotFlowJson(rawDraft);
    if (!parsed) {
      toast("Invalid chatbot JSON", "error");
      return;
    }
    setNodes(parsed);
    setSelectedId(parsed[FLOW_START] ? FLOW_START : Object.keys(parsed)[0] ?? "");
    setShowRaw(false);
    toast("Raw JSON applied to editor (not saved yet)");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="inline-flex h-10 items-center justify-center rounded-default bg-accent px-4 text-sm font-medium text-surface disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save chatbot flow"}
        </button>
        <button
          type="button"
          onClick={addNode}
          className="inline-flex h-10 items-center justify-center rounded-default border border-border px-4 text-sm font-medium text-foreground"
        >
          Add node
        </button>
        <button
          type="button"
          onClick={handleResetToDefaults}
          className="inline-flex h-10 items-center justify-center rounded-default border border-border px-4 text-sm font-medium text-foreground"
        >
          Load built-in
        </button>
        <button
          type="button"
          onClick={() => void handleClearCustom()}
          disabled={saving}
          className="inline-flex h-10 items-center justify-center rounded-default border border-border px-4 text-sm font-medium text-foreground disabled:opacity-60"
        >
          Clear CMS override
        </button>
        <button
          type="button"
          onClick={() => {
            setRawDraft(JSON.stringify(nodes, null, 2));
            setShowRaw((v) => !v);
          }}
          className="inline-flex h-10 items-center justify-center rounded-default border border-border px-4 text-sm font-medium text-foreground"
        >
          {showRaw ? "Hide raw JSON" : "Edit raw JSON"}
        </button>
      </div>

      {showRaw ? (
        <div className="space-y-2">
          <textarea
            rows={12}
            value={rawDraft}
            onChange={(e) => setRawDraft(e.target.value)}
            className={`${fieldClassName} font-mono text-xs`}
          />
          <button
            type="button"
            onClick={applyRaw}
            className="inline-flex h-10 items-center justify-center rounded-default border border-border px-4 text-sm font-medium text-foreground"
          >
            Apply raw to editor
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <ul className="space-y-1 rounded-default border border-border bg-background p-2">
          {nodeIds.map((id) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => setSelectedId(id)}
                className={`flex w-full items-center justify-between rounded-default px-3 py-2 text-left text-sm ${
                  selectedId === id
                    ? "bg-accent text-surface"
                    : "text-foreground hover:bg-surface"
                }`}
              >
                <span className="truncate font-mono text-xs">{id}</span>
                <span className="ml-2 shrink-0 text-[0.65rem] opacity-80">
                  {nodes[id]?.kind}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {selected ? (
          <div className="space-y-4 rounded-default border border-border bg-surface p-4">
            <div className="flex flex-wrap items-end gap-3">
              <label className="min-w-[160px] flex-1 space-y-1">
                <span className="text-xs font-medium text-muted">Node id</span>
                <input
                  value={selected.id}
                  onChange={(e) => {
                    const nextId = e.target.value.trim();
                    if (!nextId || nextId === selectedId) {
                      updateNode(selectedId, { ...selected, id: e.target.value });
                      return;
                    }
                    if (nodes[nextId]) {
                      toast("Node id already exists", "error");
                      return;
                    }
                    setNodes((current) => {
                      const copy = { ...current };
                      const node = { ...copy[selectedId], id: nextId };
                      delete copy[selectedId];
                      copy[nextId] = node;
                      return copy;
                    });
                    setSelectedId(nextId);
                  }}
                  className={`${fieldClassName} font-mono text-xs`}
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-muted">Kind</span>
                <select
                  value={selected.kind}
                  onChange={(e) => {
                    const kind = e.target.value as FlowNode["kind"];
                    if (kind === "question") {
                      updateNode(selectedId, {
                        id: selected.id,
                        kind: "question",
                        messages:
                          selected.kind === "form"
                            ? [selected.intro]
                            : "messages" in selected
                              ? selected.messages
                              : [""],
                        choices:
                          selected.kind === "question" ||
                          selected.kind === "success"
                            ? selected.choices
                            : [],
                      });
                    } else if (kind === "form") {
                      updateNode(selectedId, {
                        id: selected.id,
                        kind: "form",
                        intro:
                          selected.kind === "form"
                            ? selected.intro
                            : "messages" in selected
                              ? selected.messages[0] ?? ""
                              : "",
                        includeMessage:
                          selected.kind === "form"
                            ? selected.includeMessage
                            : true,
                        messagePlaceholder:
                          selected.kind === "form"
                            ? selected.messagePlaceholder
                            : "Tell us a bit more…",
                      });
                    } else if (kind === "success") {
                      updateNode(selectedId, {
                        id: selected.id,
                        kind: "success",
                        messages:
                          "messages" in selected ? selected.messages : [""],
                        choices:
                          selected.kind === "question" ||
                          selected.kind === "success"
                            ? selected.choices
                            : [],
                      });
                    } else {
                      updateNode(selectedId, {
                        id: selected.id,
                        kind: "fallback",
                        messages:
                          "messages" in selected
                            ? selected.messages
                            : ["Let's start over."],
                        next: FLOW_START,
                      });
                    }
                  }}
                  className={fieldClassName}
                >
                  <option value="question">Question</option>
                  <option value="form">Form</option>
                  <option value="success">Success</option>
                  <option value="fallback">Fallback</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() => removeNode(selectedId)}
                className="inline-flex h-10 items-center rounded-default border border-danger/30 px-3 text-sm text-danger"
              >
                Remove node
              </button>
            </div>

            {selected.kind === "form" ? (
              <div className="space-y-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-muted">Intro</span>
                  <textarea
                    rows={3}
                    value={selected.intro}
                    onChange={(e) =>
                      updateNode(selectedId, {
                        ...selected,
                        intro: e.target.value,
                      })
                    }
                    className={fieldClassName}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={Boolean(selected.includeMessage)}
                    onChange={(e) =>
                      updateNode(selectedId, {
                        ...selected,
                        includeMessage: e.target.checked,
                      })
                    }
                    className="size-4 rounded border-border text-accent"
                  />
                  Include message field
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-muted">
                    Message placeholder
                  </span>
                  <input
                    value={selected.messagePlaceholder ?? ""}
                    onChange={(e) =>
                      updateNode(selectedId, {
                        ...selected,
                        messagePlaceholder: e.target.value,
                      })
                    }
                    className={fieldClassName}
                  />
                </label>
              </div>
            ) : null}

            {selected.kind === "fallback" ? (
              <div className="space-y-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-muted">
                    Messages (one per line)
                  </span>
                  <textarea
                    rows={3}
                    value={selected.messages.join("\n")}
                    onChange={(e) =>
                      updateNode(selectedId, {
                        ...selected,
                        messages: e.target.value.split("\n"),
                      })
                    }
                    className={fieldClassName}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-muted">
                    Next node
                  </span>
                  <select
                    value={selected.next}
                    onChange={(e) =>
                      updateNode(selectedId, {
                        ...selected,
                        next: e.target.value,
                      })
                    }
                    className={fieldClassName}
                  >
                    {nodeIds.map((id) => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}

            {selected.kind === "question" || selected.kind === "success" ? (
              <div className="space-y-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-muted">
                    Messages (one per line)
                  </span>
                  <textarea
                    rows={4}
                    value={selected.messages.join("\n")}
                    onChange={(e) =>
                      updateNode(selectedId, {
                        ...selected,
                        messages: e.target.value.split("\n"),
                      })
                    }
                    className={fieldClassName}
                  />
                </label>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">
                      Choices
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        updateNode(selectedId, {
                          ...selected,
                          choices: [
                            ...selected.choices,
                            {
                              id: `choice_${Math.random().toString(36).slice(2, 7)}`,
                              label: "New choice",
                              next: FLOW_START,
                            },
                          ],
                        })
                      }
                      className="text-sm font-medium text-accent"
                    >
                      Add choice
                    </button>
                  </div>
                  {selected.choices.map((choice, index) => {
                    const link = isLinkChoice(choice);
                    return (
                      <div
                        key={`${choice.id}-${index}`}
                        className="space-y-2 rounded-default border border-border bg-background p-3"
                      >
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input
                            value={choice.id}
                            onChange={(e) => {
                              const choices = [...selected.choices];
                              choices[index] = {
                                ...choice,
                                id: e.target.value,
                              };
                              updateNode(selectedId, { ...selected, choices });
                            }}
                            placeholder="Choice id"
                            className={`${fieldClassName} font-mono text-xs`}
                          />
                          <input
                            value={choice.label}
                            onChange={(e) => {
                              const choices = [...selected.choices];
                              choices[index] = {
                                ...choice,
                                label: e.target.value,
                              };
                              updateNode(selectedId, { ...selected, choices });
                            }}
                            placeholder="Button label"
                            className={fieldClassName}
                          />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-foreground">
                          <input
                            type="checkbox"
                            checked={link}
                            onChange={(e) => {
                              const choices = [...selected.choices];
                              choices[index] = e.target.checked
                                ? {
                                    id: choice.id,
                                    label: choice.label,
                                    href: "/contact-us",
                                  }
                                : {
                                    id: choice.id,
                                    label: choice.label,
                                    next: FLOW_START,
                                  };
                              updateNode(selectedId, { ...selected, choices });
                            }}
                            className="size-4 rounded border-border text-accent"
                          />
                          Link out (instead of next node)
                        </label>
                        {link ? (
                          <ContentHrefField
                            value={choice.href}
                            onChange={(href) => {
                              const choices = [...selected.choices];
                              choices[index] = {
                                id: choice.id,
                                label: choice.label,
                                href,
                              };
                              updateNode(selectedId, { ...selected, choices });
                            }}
                            linkOptions={linkOptions}
                            inputAriaLabel="Choice href"
                          />
                        ) : (
                          <select
                            value={"next" in choice ? choice.next : FLOW_START}
                            onChange={(e) => {
                              const choices = [...selected.choices];
                              choices[index] = {
                                id: choice.id,
                                label: choice.label,
                                next: e.target.value,
                              };
                              updateNode(selectedId, { ...selected, choices });
                            }}
                            className={fieldClassName}
                          >
                            {nodeIds.map((id) => (
                              <option key={id} value={id}>
                                {id}
                              </option>
                            ))}
                          </select>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            updateNode(selectedId, {
                              ...selected,
                              choices: selected.choices.filter(
                                (_, i) => i !== index,
                              ),
                            })
                          }
                          className="text-xs text-danger"
                        >
                          Remove choice
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted">Select a node to edit.</p>
        )}
      </div>
    </div>
  );
}
