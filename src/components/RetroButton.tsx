import Button, { ButtonProps } from "@mui/material/Button";
import { styled, darken } from "@mui/material/styles";

type RetroButtonProps = ButtonProps;

const RetroButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "ownerState",
})<RetroButtonProps>(({ theme, ...ownerState }) => {
  const colorProp =
    ownerState.color === "inherit" ? "primary" : ownerState.color || "primary";
  // @ts-ignore
  const colorMain =
    theme.palette[colorProp]?.main || theme.palette.primary.main;
  const shadowColor = darken(colorMain, 0.5);
  const isOutlined = ownerState.variant === "outlined";

  return {
    boxShadow: `4px 4px 0 ${shadowColor}`,

    backgroundColor: isOutlined ? "transparent" : colorMain,
    color: isOutlined ? colorMain : theme.palette.getContrastText(colorMain),
    border: isOutlined ? `2px solid ${colorMain}` : "none",
    borderTopLeftRadius: "4px",
    borderTopRightRadius: "0px",
    borderBottomRightRadius: "4px",
    borderBottomLeftRadius: "0px",
    textTransform: "uppercase",
    fontWeight: 700,
    fontFamily: "monospace, sans-serif",
    fontSize: "16px",
    padding: "12px 24px",
    minWidth: "auto",
    position: "relative",
    transition: "transform 0.1s ease-in-out, box-shadow 0.1s ease-in-out",

    "&:hover": {
      backgroundColor: isOutlined ? "transparent" : colorMain,
      border: isOutlined ? `2px solid ${colorMain}` : "none",
    },

    "&:active": {
      transform: "translateY(4px)",
      boxShadow: "none",
    },

    "&:disabled": {
      backgroundColor: theme.palette.action.disabledBackground,
      color: theme.palette.action.disabled,
      boxShadow: "none",
      cursor: "not-allowed",
    },
  };
});

export default RetroButton;
