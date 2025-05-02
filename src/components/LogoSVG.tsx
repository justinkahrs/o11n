import type React from "react";
import { useTheme } from "@mui/material";
type LogoProps = React.SVGProps<SVGSVGElement> & {
  section1Color?: string;
  section2Color?: string;
  section3Color?: string;
  height?: string;
};
const Logo: React.FC<LogoProps> = (props) => {
  const theme = useTheme();
  const {
    section1Color = theme.palette.primary.main,
    section2Color = theme.palette.secondary.main,
    section3Color = theme.palette.secondary.dark,
    height = "5em",
    ...svgProps
  } = props;
  return (
    <svg
      height={height}
      viewBox="0 0 673 347"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ margin: 0 }}
      {...svgProps}
    >
      <title>o11n-logo</title>
      <g id="logo">
        <g id="section3">
          <path
            d="M229.5 303.5H201V317H158.5V331.5H262V346.5H286.5V331.5H423.5V317.5H340V303.5H286.5V317.5H229.5V303.5Z"
            fill={section3Color}
          />
          <path d="M469.5 347V331.5H508.5V347H469.5Z" fill={section3Color} />
        </g>
        <g id="section2">
          <path
            d="M44.5 137.5H0V192.5H18.5V209.5H33.5V226.5H140.5V209.5H158.5V192.5H177.5V137.5H131V192.5H44.5V137.5Z"
            fill={section2Color}
          />
          <path
            d="M250 192.5V137.5H294V192.5H332.5V226.5H210.5V192.5H250Z"
            fill={section2Color}
          />
          <path
            d="M428 137.5H385V226.5H445V192.5H428V137.5Z"
            fill={section2Color}
          />
          <path
            d="M521.5 150.5H478.5V226.5H521.5V150.5Z"
            fill={section2Color}
          />
          <path d="M627.5 226.5V137.5H673V226.5H627.5Z" fill={section2Color} />
          <path
            d="M423.5 331.5V317.5H521.5V331.5H560V347H508.5V331.5H423.5Z"
            fill={section2Color}
          />
        </g>
        <g id="section1">
          <path
            d="M44.5 130H0V93.5H17.5V78H33V61.5H141V78H159V93.5H177.5V137.5H131V93.5H44.5V130Z"
            fill={section1Color}
          />
          <path
            d="M197 59V26H238.5V0H294V137.5H250V59H197Z"
            fill={section1Color}
          />
          <path
            d="M338 59V26H372V0H428V137.5H385V59H338Z"
            fill={section1Color}
          />
          <path
            d="M478.5 143V61.5H521.5V93.5H538.5V78H547V61.5H634.5V78H653.5V93.5H673V137.5H627.5V93.5H538.5V109H521.5V143H478.5Z"
            fill={section1Color}
          />
          <path d="M11 331.5V317H66.5V331.5H11Z" fill={section1Color} />
          <path
            d="M89.5 331.5V317H135.5V303.5H201V317H158.5V331.5H89.5Z"
            fill={section1Color}
          />
          <path d="M201 346.5V331.5H262V346.5H201Z" fill={section1Color} />
          <path d="M595.5 317H568.5V333.5H595.5V317Z" fill={section1Color} />
          <path d="M614 346.5V333.5H667V346.5H614Z" fill={section1Color} />
        </g>
      </g>
    </svg>
  );
};
export default Logo;
