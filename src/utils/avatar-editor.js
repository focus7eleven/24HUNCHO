import React from 'react';
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom';
import createClass from 'create-react-class'
import 'blueimp-canvastoblob'

const dpi = window.devicePixelRatio || 1

const isTouchDevice = !!(
	typeof window !== 'undefined' &&
	typeof navigator !== 'undefined' &&
	('ontouchstart' in window || navigator.msMaxTouchPoints > 0)
);

const draggableEvents = {
	touch: {
		react: {
			down: 'onTouchStart',
			mouseDown: 'onMouseDown',
			drag: 'onTouchMove',
			drop: 'onTouchEnd',
			move: 'onTouchMove',
			mouseMove: 'onMouseMove',
			up: 'onTouchEnd',
			mouseUp: 'onMouseUp'
		},
		native: {
			down: 'touchstart',
			mouseDown: 'mousedown',
			drag: 'touchmove',
			drop: 'touchend',
			move: 'touchmove',
			mouseMove: 'mousemove',
			up: 'touchend',
			mouseUp: 'mouseup'
		}
	},
	desktop: {
		react: {
			down: 'onMouseDown',
			drag: 'onDragOver',
			drop: 'onDrop',
			move: 'onMouseMove',
			up: 'onMouseUp'
		},
		native: {
			down: 'mousedown',
			drag: 'dragStart',
			drop: 'drop',
			move: 'mousemove',
			up: 'mouseup'
		}
	}
};
const deviceEvents = isTouchDevice ? draggableEvents.touch : draggableEvents.desktop;

// Draws a rounded rectangle on a 2D context.
const drawRoundedRect = (ctx, totalWidth, totalHeight, x, y, width, height, borderRadius) => {
	ctx.strokeStyle = "#dedede";
	if (borderRadius == 0) {
		ctx.strokeRect(x, y, width, height);

		ctx.beginPath()
		ctx.moveTo(0, 0)
		ctx.lineTo(totalWidth, 0)
		ctx.lineTo(totalWidth, totalHeight)
		ctx.lineTo(0, totalHeight)
		ctx.lineTo(0, 0)

		x += 1
		y += 1
		width -= 2
		height -= 2
		ctx.moveTo(x, y)
		ctx.lineTo(x + width, y)
		ctx.lineTo(x + width, y + height)
		ctx.lineTo(x, y + height)
		ctx.lineTo(x, y)

	} else {

		ctx.beginPath()
		ctx.moveTo(0, 0)
		ctx.lineTo(totalWidth, 0)
		ctx.lineTo(totalWidth, totalHeight)
		ctx.lineTo(0, totalHeight)
		ctx.lineTo(0, 0)

		const widthMinusRad = width - borderRadius
    const heightMinusRad = height - borderRadius
    ctx.translate(x, y)
    ctx.arc(
      borderRadius,
      borderRadius,
      borderRadius,
      Math.PI,
      Math.PI * 1.5
    )
    ctx.lineTo(widthMinusRad, 0)
    ctx.arc(
      widthMinusRad,
      borderRadius,
      borderRadius,
      Math.PI * 1.5,
      Math.PI * 2
    )
    ctx.lineTo(width, heightMinusRad)
    ctx.arc(
      widthMinusRad,
      heightMinusRad,
      borderRadius,
      Math.PI * 2,
      Math.PI * 0.5
    )
    ctx.lineTo(borderRadius, height)
    ctx.arc(
      borderRadius,
      heightMinusRad,
      borderRadius,
      Math.PI * 0.5,
      Math.PI
    )
    ctx.translate(-x, -y)
	}
	ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
	ctx.fill('evenodd')
};

const AvatarEditor = createClass({
	propTypes: {
		scale: PropTypes.number,
		image: PropTypes.string,
		border: PropTypes.array, // [vertical border, horizontal border]
		width: PropTypes.number,
		height: PropTypes.number,
		borderRadius: PropTypes.number,
		style: PropTypes.object,

		onDropFile: PropTypes.func,
		onLoadFailure: PropTypes.func,
		onLoadSuccess: PropTypes.func,
		onImageReady: PropTypes.func,
		onMouseUp: PropTypes.func,
		onMouseMove: PropTypes.func
	},

	getDefaultProps() {
		return {
			scale: 1,
			border: [0, 0],
			width: 200,
			height: 200,
			borderRadius: 0,
			style: {},
			widthMask: true,

			onDropFile() {},
			onLoadFailure() {},
			onLoadSuccess() {},
			onImageReady() {},
			onMouseUp() {},
			onMouseMove() {}
		}
	},

	getInitialState() {
		return {
			drag: false,
			my: null,
			mx: null,
			image: {
				x: 0,
				y: 0
			}
		};
	},

	getDimensions() {
		const {
			width,
			height,
			border,
			borderRadius,
		} = this.props

		return {
			width: this.props.width * dpi,
			height: this.props.height * dpi,
			crop: {
				x: border[1] * dpi,
				y: border[0] * dpi,
				width: (width - 2 * border[1]) * dpi,
				height: (height - 2 * border[0]) * dpi,
			},
			borderRadius: borderRadius * dpi,
		}
	},

	getImage() {
		const cropRect = this.getDimensions().crop;
		const image = this.state.image;
		const imagePosition = this.calculatePosition(image)

		// create a canvas with the correct dimensions
		const canvas = document.createElement('canvas');
		canvas.width  = cropRect.width;
		canvas.height = cropRect.height;

		// draw the full-size image at the correct position,
		// the image gets truncated to the size of the canvas.
		const ctx = canvas.getContext('2d')
		ctx.fillStyle = 'white'
		ctx.fillRect(0, 0, cropRect.width, cropRect.height)
		canvas.getContext('2d').drawImage(image.resource, - (cropRect.x - imagePosition.x), - (cropRect.y - imagePosition.y), imagePosition.width, imagePosition.height);

		return canvas;
	},

	isDataURL(str) {
		const regex = /^\s*data:([a-z]+\/[a-z]+(;[a-z\-]+\=[a-z\-]+)?)?(;base64)?,[a-z0-9\!\$\&\'\,\(\)\*\+\,\;\=\-\.\_\~\:\@\/\?\%\s]*\s*$/i;
		return !!str.match(regex);
	},

	loadImage(imageURL) {
		const imageObj = new Image();

		imageObj.onload = this.handleImageReady.bind(this, imageObj);
		imageObj.onerror = this.props.onLoadFailure;

		if (!this.isDataURL(imageURL)) imageObj.crossOrigin = 'anonymous';

		imageObj.src = imageURL;
	},

	componentDidMount() {
		const context = ReactDOM.findDOMNode(this.refs.canvas).getContext('2d');

		if (this.props.image) {
			this.loadImage(this.props.image);
		}

		this.paint(context);

		if (document) {
			const nativeEvents = deviceEvents.native;
			document.addEventListener(nativeEvents.move, this.handleMouseMove, false);
			document.addEventListener(nativeEvents.up, this.handleMouseUp, false);

			if (isTouchDevice) {
				document.addEventListener(nativeEvents.mouseMove, this.handleMouseMove, false);
				document.addEventListener(nativeEvents.mouseUp, this.handleMouseUp, false);
			}
		}
	},

	componentWillUnmount() {
		if (document) {
			const nativeEvents = deviceEvents.native;
			document.removeEventListener(nativeEvents.move, this.handleMouseMove, false);
			document.removeEventListener(nativeEvents.up, this.handleMouseUp, false);
			if (isTouchDevice) {
				document.removeEventListener(nativeEvents.mouseMove, this.handleMouseMove, false);
				document.removeEventListener(nativeEvents.mouseUp, this.handleMouseUp, false);
			}
		}
	},

	componentDidUpdate() {
		const context = ReactDOM.findDOMNode(this.refs.canvas).getContext('2d');

		context.clearRect(0, 0, this.getDimensions().width, this.getDimensions().height);

		this.paint(context);
		this.paintImage(context);
	},

	handleImageReady(image) {
		const imageState = this.getInitialSize(image.width, image.height);

		imageState.resource = image;
		this.setState({ drag: false, image: imageState}, this.props.onImageReady);
		this.props.onLoadSuccess(imageState);
	},

	getInitialSize(width, height) {
		let newHeight;
		let newWidth;

		const crop = this.getDimensions().crop;
		const canvasRatio = crop.height / crop.width;
		const imageRatio = height / width;

		if (canvasRatio > imageRatio) {
			newHeight = (crop.height);
			newWidth = (width * (newHeight / height));
		} else {
			newWidth = (crop.width);
			newHeight = (height * (newWidth / width));
		}

		return {
			height: newHeight,
			width: newWidth,
			x: 0,
			y: 0,
		};
	},

	componentWillReceiveProps(newProps) {
		if (this.props.image != newProps.image) {
			this.loadImage(newProps.image);
		}
		if (
			this.props.scale != newProps.scale
			|| this.props.height != newProps.height
			|| this.props.width != newProps.width
			|| this.props.border != newProps.border
		) {
			this.squeeze(newProps);
		}
	},

	paintImage(context) {
		const image = this.state.image

		if (image.resource) {
			const position = this.calculatePosition(image);

			context.save();
			context.globalCompositeOperation = 'destination-over';
			context.drawImage(image.resource, position.x, position.y, position.width, position.height);

			context.restore();
		}
	},

	calculatePosition(image) {
		const dimensions = this.getDimensions();
		const crop = dimensions.crop

		const width = image.width * this.props.scale;
		const height = image.height * this.props.scale;

		return {
			x: crop.x - (width - crop.width) / 2 + image.x,
			y: crop.y - (height - crop.height) / 2 + image.y,
			width,
			height,
		}
	},

	paint(context) {
		context.save();
		context.translate(0, 0);

		const dimensions = this.getDimensions();
		const crop = dimensions.crop
		const height = dimensions.height;
		const width = dimensions.width;
		const borderRadius = dimensions.borderRadius

		this.props.widthMask && drawRoundedRect(context, width, height, crop.x, crop.y, crop.width, crop.height, borderRadius);

		context.restore();
	},

	handleMouseDown(e) {
		e = e || window.event;
		// if e is a touch event, preventDefault keeps
		// corresponding mouse events from also being fired
		// later.
		e.preventDefault();
		this.setState({
			drag: true,
			mx: null,
			my: null
		});
	},
	handleMouseUp() {
		if (this.state.drag) {
			this.setState({drag: false});
			this.props.onMouseUp();
		}
	},

	handleMouseMove(e) {
		e = e || window.event;
		if (false == this.state.drag) {
			return;
		}

		let imageState = this.state.image;
		const lastX = imageState.x;
		const lastY = imageState.y;

		const mousePositionX = e.targetTouches ? e.targetTouches[0].pageX : e.clientX;
		const mousePositionY = e.targetTouches ? e.targetTouches[0].pageY : e.clientY;

		const newState = { mx: mousePositionX, my: mousePositionY, image: imageState };

		if (this.state.mx && this.state.my) {
			const xDiff = (this.state.mx - mousePositionX) / this.props.scale;
			const yDiff = (this.state.my - mousePositionY) / this.props.scale;

			imageState.y = this.getBoundedY(lastY - yDiff, this.props.scale);
			imageState.x = this.getBoundedX(lastX - xDiff, this.props.scale);
		}

		this.setState(newState);
		this.props.onMouseMove();
	},

	squeeze(props) {
		let imageState = this.state.image;
		imageState.y = this.getBoundedY(imageState.y, props.scale);
		imageState.x = this.getBoundedX(imageState.x, props.scale);
		this.setState({ image: imageState });
	},

	getBoundedX(x, scale) {
		const image = this.state.image;
		const dimensions = this.getDimensions().crop;

		let widthDiff = Math.floor((image.width * scale - dimensions.width) / 2);
		widthDiff = Math.max(0, widthDiff);

		return Math.max(-widthDiff, Math.min(x, widthDiff));
	},

	getBoundedY(y, scale) {
		const image = this.state.image;
		const dimensions = this.getDimensions().crop;
		let heightDiff = Math.floor((image.height * scale - dimensions.height) / 2);
		heightDiff = Math.max(0, heightDiff);

		return Math.max(-heightDiff, Math.min(y, heightDiff));
	},

	handleDragOver(e) {
		e = e || window.event;
		e.preventDefault();
	},

	handleDrop(e) {
		e = e || window.event;
		e.stopPropagation();
		e.preventDefault();

		if (e.dataTransfer && e.dataTransfer.files.length) {
			this.props.onDropFile(e);
			const reader = new FileReader();
			const file = e.dataTransfer.files[0];
			reader.onload = (e) => this.loadImage(e.target.result);
			reader.readAsDataURL(file);
		}
	},

	render() {
		const dim = this.getDimensions()

		const defaultStyle = {
			cursor: this.state.drag ? 'grabbing' : 'grab',
			width: this.props.width,
			height: this.props.height,
			backgroundColor: 'white',
		};

		const attributes = {
			width: dim.width,
			height: dim.height,
			style: {
				...defaultStyle,
				...this.props.style,
			}
		};

		attributes[deviceEvents.react.down] = this.handleMouseDown;
		attributes[deviceEvents.react.drag] = this.handleDragOver;
		attributes[deviceEvents.react.drop] = this.handleDrop;
		if (isTouchDevice) attributes[deviceEvents.react.mouseDown] = this.handleMouseDown;

		return (
			<canvas ref='canvas' {...attributes} />
		);
	}
});

export default AvatarEditor;
