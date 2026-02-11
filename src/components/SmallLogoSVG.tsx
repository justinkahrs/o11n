import type React from "react";
import { useTheme } from "@mui/material";

type SmallLogoProps = React.SVGProps<SVGSVGElement> & {
  section1Color?: string;
  section2Color?: string;
  height?: string;
  width?: string;
};

const SmallLogo: React.FC<SmallLogoProps> = (props) => {
  const theme = useTheme();
  const {
    section1Color = theme.palette.primary.main,
    section2Color = theme.palette.secondary.main,
    height = "5em",
    width = "5em",
    ...svgProps
  } = props;

  return (
    <svg
      height={height}
      width={width}
      viewBox="10 38 155 208"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ margin: 0 }}
      {...svgProps}
    >
      <title>o11n-logo</title>
      <g id="logo">
        <g id="section2">
          <path
            d="M44.5 137.5H0V192.5H18.5V209.5H33.5V226.5H140.5V209.5H158.5V192.5H177.5V137.5H131V192.5H44.5V137.5Z"
            fill={section2Color}
          />
        </g>
        <g id="section1">
          <path
            d="M44.5 130H0V93.5H17.5V78H33V61.5H141V78H159V93.5H177.5V137.5H131V93.5H44.5V130Z"
            fill={section1Color}
          />
        </g>
      </g>
    </svg>
  );
};

export default SmallLogo;
