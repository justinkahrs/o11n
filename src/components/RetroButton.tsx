import Button, { ButtonProps } from "@mui/material/Button";
import { styled, darken } from "@mui/material/styles";

type RetroButtonProps = ButtonProps;

const RetroButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "ownerState",
})<RetroButtonProps>(({ theme, ...ownerState }) => {
  const shadowColor = darken(theme.palette.primary.main, 0.5);
  const isOutlined = ownerState.variant === "outlined";

  return {
    boxShadow: `4px 4px 0 ${shadowColor}`,

    backgroundColor: isOutlined ? "transparent" : theme.palette.primary.main,
    color: isOutlined
      ? theme.palette.primary.main
      : theme.palette.getContrastText(theme.palette.primary.main),
    border: isOutlined ? `2px solid ${theme.palette.primary.main}` : "none",
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
      backgroundColor: isOutlined ? "transparent" : theme.palette.primary.main,
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
