"use client";

import { Component, type ReactNode } from "react";

type SectionErrorBoundaryProps = {
  /** Identifies the section in server/browser logs. */
  label: string;
  children: ReactNode;
};

type SectionErrorBoundaryState = {
  hasError: boolean;
};

/**
 * Per-section error boundary for public pages: a section that throws while
 * rendering (partial CMS content, mid-edit data) is skipped instead of
 * blanking the whole page. Renders children directly — adds no DOM.
 */
export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  state: SectionErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): SectionErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`[section:${this.props.label}] render failed; skipped.`, error);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}
