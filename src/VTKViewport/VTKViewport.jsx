import React, { Component } from 'react';
import PropTypes from 'prop-types';
//import debounce from 'lodash.debounce';
import './VTKViewport.css';
const EVENT_RESIZE = 'resize';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkGenericRenderWindow from 'vtk.js/Sources/Rendering/Misc/GenericRenderWindow';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';
import CustomSliceInteractorStyle from './vtkCustomSliceInteractor.js';

/* One ultimate experiment might be to use one large render window for all viewports
   which just sits behind the layout in html and renders each viewport based on the position
   and size of the 'viewport'

- Render window is the large div
- renderer is each smaller viewport


Plugin could take in an array of render windows
- Each render window has a set of coordinates (top, left, width, height)
- Each render window has a set of *actors* to populate the scene
- Each render window has an interactor

vtkRenderWindows: [
  {
    position: {top, left, width, height},
    actors: ['CT', 'SEG'],
    interactorStyle: '',
  }
]
*/

class VTKViewport extends Component {
  static defaultProps = {
    background: [0, 0, 1],
    vtkActors: []
  };

  static propTypes = {
    background: PropTypes.arrayOf(PropTypes.number).isRequired,
    vtkActors: PropTypes.arrayOf(PropTypes.object).isRequired
  };

  componentDidMount() {
    const { background, vtkActors } = this.props;
    const genericRenderWindow = vtkGenericRenderWindow.newInstance({
      background
    });

    genericRenderWindow.setContainer(this.element);
    this.genericRenderWindow = genericRenderWindow;

    const renderWindow = genericRenderWindow.getRenderWindow();
    const renderer = genericRenderWindow.getRenderer();

    vtkActors.forEach(actor => {
      renderer.addActor(actor);
    });

    renderWindow.render();

    const style = 'rotate';

    this.setVTKInteractorStyle(style, renderWindow, vtkActors);
  }

  render() {
    return (
      <div
        className={'VTKViewport'}
        ref={input => {
          this.element = input;
        }}
      />
    );
  }

  setVTKInteractorStyle(style = 'slice', renderWindow, actors) {
    if (!actors.length) {
      return;
    }

    const interactor = renderWindow.getInteractor();

    if (style === 'slice') {
      // use our custom style
      const istyle = CustomSliceInteractorStyle.newInstance();
      istyle.setCurrentVolumeNumber(0); // background volume
      istyle.setSlicingMode(1, true); // force set slice mode
      istyle.setSlice(40);

      interactor.setInteractorStyle(istyle);
    } else if (style === 'rotate') {
      // Use the vtk standard style with custom settings
      const renderer = this.genericRenderWindow.getRenderer();

      renderer.resetCamera();
      renderer.getActiveCamera().setViewUp(0, 0, 1);

      const bounds = actors[0].getBounds();
      const center = [
        (bounds[0] + bounds[1]) / 2,
        (bounds[2] + bounds[3]) / 2,
        (bounds[4] + bounds[5]) / 2
      ];
      const position = center.slice();
      position[1] -= 4.25 * (-bounds[2] - center[1]);

      renderer.getActiveCamera().setPosition(...position);
      renderer.getActiveCamera().setFocalPoint(...center);
      renderer.updateLightsGeometryToFollowCamera();

      const istyle = vtkInteractorStyleTrackballCamera.newInstance();
      istyle.get().autoAdjustCameraClippingRange = false;

      console.warn('Hard coding clipping range');
      renderer.getActiveCamera().setClippingRange([645, 647]);

      interactor.setInteractorStyle(istyle);
    } else {
      throw new Error(`setVTKInteractorStyle: bad style '${style}'`);
    }
  }
}

export default VTKViewport;