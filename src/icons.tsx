import type { ComponentChildren } from "preact";

type IconProps = { class?: string };

function Icon(props: IconProps & { children: ComponentChildren }) {
    return (
        <svg
            class={props.class ? `icon ${props.class}` : "icon"}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            {props.children}
        </svg>
    );
}

export function Mark(props: IconProps) {
    return (
        <svg
            class={props.class}
            viewBox="0 0 32 32"
            fill="none"
            stroke="currentColor"
            stroke-linejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            <circle cx="16" cy="16" r="14.25" stroke-width="1.5" />
            <circle cx="16" cy="16" r="10.5" stroke-width="1" />
            <path d="M16 5.5 25.09 21.25H6.91Z M16 26.5 6.91 10.75h18.18Z" stroke-width="1.25" />
            <circle cx="16" cy="16" r="1.5" fill="currentColor" stroke="none" />
        </svg>
    );
}

export function IconPlay(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M7 4.5v15l12-7.5Z" fill="currentColor" />
        </Icon>
    );
}

export function IconSpinner(props: IconProps) {
    return (
        <Icon class={props.class ? `spin ${props.class}` : "spin"}>
            <path d="M21 12a9 9 0 1 1-6.2-8.56" />
        </Icon>
    );
}

export function IconCheck(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="m5 12.5 4.5 4.5L19 7" />
        </Icon>
    );
}

export function IconAlert(props: IconProps) {
    return (
        <Icon {...props}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5.5M12 16.5h.01" />
        </Icon>
    );
}

export function IconDot(props: IconProps) {
    return (
        <Icon {...props}>
            <circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" />
        </Icon>
    );
}

export function IconText(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M4 6h16M4 12h11M4 18h7" />
        </Icon>
    );
}

export function IconOutput(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M4 5v6a4 4 0 0 0 4 4h12M15 10l5 5-5 5" />
        </Icon>
    );
}

export function IconBraces(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M8 4H7a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2 2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h1" />
            <path d="M16 4h1a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2 2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-1" />
        </Icon>
    );
}

export function IconCopy(props: IconProps) {
    return (
        <Icon {...props}>
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
        </Icon>
    );
}

export function IconLink(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M10 14a4.5 4.5 0 0 0 6.36 0l3.18-3.18a4.5 4.5 0 0 0-6.36-6.36L11.5 6.1" />
            <path d="M14 10a4.5 4.5 0 0 0-6.36 0l-3.18 3.18a4.5 4.5 0 0 0 6.36 6.36l1.68-1.64" />
        </Icon>
    );
}

export function IconGitHub(props: IconProps) {
    return (
        <svg
            class={props.class ? `icon ${props.class}` : "icon"}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            focusable="false"
        >
            <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.82-.26.82-.57v-2.04c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.31-5.47-1.34-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.23 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.62-5.48 5.92.42.36.81 1.1.81 2.22v3.29c0 .32.21.69.82.57A12 12 0 0 0 12 .3" />
        </svg>
    );
}
