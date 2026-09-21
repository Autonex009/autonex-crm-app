import { Component, type ErrorInfo, type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { spacing } from "../theme";
import { Button } from "./Button";
import { Txt } from "./primitives";
import { Screen } from "./Screen";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Last line of defence around the whole app.
 *
 * In development an uncaught render error opens LogBox with a stack trace. A
 * release build has no LogBox: the same error unmounts the tree and leaves a
 * blank screen with nothing to do but force-quit. This catches it and offers
 * the one recovery a phone user can actually perform, plus the message itself
 * so a bug report says something useful.
 *
 * Only render errors reach here — an error thrown from an event handler or a
 * promise does not. Those are handled where they happen: every screen's data
 * goes through TanStack Query, which surfaces failures as an error state.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // No crash reporter is wired up yet. This at least puts the component
    // stack in `adb logcat`, which is reachable on a release build.
    console.error("Unhandled render error", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <Screen edges={["top", "bottom", "left", "right"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Txt variant="display">Something broke</Txt>
          <Txt variant="body" color="muted">
            The app hit an unexpected error and had to stop. Trying again
            reloads the screen; if it keeps happening, send this message to the
            team.
          </Txt>

          <View style={styles.detail}>
            <Txt variant="caption" color="subtle" uppercase>
              Details
            </Txt>
            <Txt variant="label" color="muted">
              {error.message || String(error)}
            </Txt>
          </View>

          <Button block onPress={() => this.setState({ error: null })}>
            Try again
          </Button>
        </ScrollView>
      </Screen>
    );
  }
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  detail: { gap: 4 },
});
