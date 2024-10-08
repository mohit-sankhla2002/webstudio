import { useStore } from "@nanostores/react";
import { useMemo } from "react";
import type { StyleProperty, StyleValue } from "@webstudio-is/css-engine";
import { propertyDescriptions } from "@webstudio-is/css-data";
import {
  CssValueListItem,
  CssValueListArrowFocus,
  Flex,
  Grid,
  Label,
  SmallIconButton,
  SmallToggleButton,
  theme,
  useSortable,
} from "@webstudio-is/design-system";
import {
  EyeconOpenIcon,
  EyeconClosedIcon,
  SubtractIcon,
} from "@webstudio-is/icons";
import type { SectionProps } from "../shared/section";
import { FloatingPanel } from "~/builder/shared/floating-panel";
import { $assets } from "~/shared/nano-states";
import type { StyleInfo } from "../../shared/style-info";
import { ColorControl } from "../../controls/color/color-control";
import {
  getLayerCount,
  layeredBackgroundProps,
  addLayer,
  deleteLayer,
  setLayerProperty,
  type SetBackgroundProperty,
  type DeleteBackgroundProperty,
  getLayerBackgroundStyleInfo,
  deleteLayerProperty,
  swapLayers,
} from "./background-layers";
import { BackgroundContent } from "./background-content";
import { getLayerName, LayerThumbnail } from "./background-thumbnail";
import { RepeatedStyleSection } from "../../shared/style-section";
import { PropertyLabel } from "../../property-label";

const Layer = (props: {
  id: string;
  index: number;
  isHighlighted: boolean;
  layerStyle: StyleInfo;
  setProperty: SetBackgroundProperty;
  deleteProperty: DeleteBackgroundProperty;
  deleteLayer: () => void;
  setBackgroundColor: (color: StyleValue) => void;
}) => {
  const assets = useStore($assets);

  const backgroundImageStyle = props.layerStyle.backgroundImage?.value;
  const isHidden =
    backgroundImageStyle?.type === "image" ||
    backgroundImageStyle?.type === "unparsed"
      ? Boolean(backgroundImageStyle.hidden)
      : false;

  const handleHiddenChange = (hidden: boolean) => {
    if (
      backgroundImageStyle?.type === "image" ||
      backgroundImageStyle?.type === "unparsed"
    ) {
      props.setProperty("backgroundImage")({
        ...backgroundImageStyle,
        hidden,
      });
    }
  };

  const canDisable =
    backgroundImageStyle?.type !== "image" &&
    backgroundImageStyle?.type !== "unparsed";

  return (
    <FloatingPanel
      title="Background"
      // Background Panel is big, and the size differs when the tabs are changed.
      // This results in the panel moving around when the tabs are changed.
      // And sometimes, the tab moves away from the cursor, when the content change happens on the top.
      // This is a workaround to prevent the panel from moving around too much when the tabs are changed from the popover trigger.
      align="center"
      collisionPadding={{ bottom: 200, top: 200 }}
      content={<BackgroundContent index={props.index} />}
    >
      <CssValueListItem
        id={props.id}
        draggable={true}
        active={props.isHighlighted}
        index={props.index}
        label={
          <Label truncate onReset={props.deleteLayer}>
            {getLayerName(props.layerStyle, assets)}
          </Label>
        }
        thumbnail={<LayerThumbnail layerStyle={props.layerStyle} />}
        hidden={isHidden}
        buttons={
          <>
            <SmallToggleButton
              disabled={canDisable}
              pressed={isHidden}
              onPressedChange={handleHiddenChange}
              variant="normal"
              tabIndex={-1}
              icon={isHidden ? <EyeconClosedIcon /> : <EyeconOpenIcon />}
            />

            <SmallIconButton
              variant="destructive"
              tabIndex={-1}
              icon={<SubtractIcon />}
              onClick={props.deleteLayer}
            />
          </>
        }
      />
    </FloatingPanel>
  );
};

export const properties = [
  "backgroundAttachment",
  "backgroundClip",
  "backgroundColor",
  "backgroundImage",
  "backgroundOrigin",
  "backgroundPositionX",
  "backgroundPositionY",
  "backgroundRepeat",
  "backgroundSize",
  "backgroundBlendMode",
] satisfies Array<StyleProperty>;

export const Section = (props: SectionProps) => {
  const { setProperty, deleteProperty, currentStyle, createBatchUpdate } =
    props;
  const layersCount = getLayerCount(currentStyle);

  const sortableItems = useMemo(
    () =>
      Array.from(Array(layersCount), (_, index) => ({
        id: `${index}`,
        index,
      })),
    [layersCount]
  );

  const { dragItemId, placementIndicator, sortableRefCallback } = useSortable({
    items: sortableItems,
    onSort: (newIndex, oldIndex) => {
      swapLayers(newIndex, oldIndex, currentStyle, createBatchUpdate);
    },
  });

  return (
    <RepeatedStyleSection
      label="Backgrounds"
      description="Add one or more backgrounds to the instance such as a color, image, or gradient."
      properties={layeredBackgroundProps}
      onAdd={() => {
        addLayer(currentStyle, createBatchUpdate);
      }}
    >
      <Flex gap={1} direction="column">
        <CssValueListArrowFocus dragItemId={dragItemId}>
          <Flex direction="column" ref={sortableRefCallback}>
            {sortableItems.map((layer, index) => (
              <Layer
                id={layer.id}
                index={index}
                key={layer.id}
                isHighlighted={dragItemId === layer.id}
                layerStyle={getLayerBackgroundStyleInfo(
                  layer.index,
                  currentStyle
                )}
                deleteLayer={deleteLayer(
                  layer.index,
                  currentStyle,
                  createBatchUpdate
                )}
                setProperty={setLayerProperty(
                  layer.index,
                  currentStyle,
                  createBatchUpdate
                )}
                deleteProperty={deleteLayerProperty(
                  layer.index,
                  currentStyle,
                  deleteProperty,
                  createBatchUpdate
                )}
                setBackgroundColor={setProperty("backgroundColor")}
              />
            ))}

            {placementIndicator}
          </Flex>
        </CssValueListArrowFocus>

        <Grid
          css={{
            px: theme.spacing[9],
            gridTemplateColumns: `1fr ${theme.spacing[23]}`,
          }}
        >
          <PropertyLabel
            label="Color"
            description={propertyDescriptions.backgroundColor}
            properties={["backgroundColor"]}
          />
          <ColorControl property="backgroundColor" />
        </Grid>
      </Flex>
    </RepeatedStyleSection>
  );
};
