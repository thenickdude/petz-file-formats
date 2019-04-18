const Parser = require("binary-parser").Parser;

const
	BHD_VERSION_BABYZ = 14,
	BHD_VERSION_PETZ = 15;

const
	BHDHeader = new Parser()
		.endianess("little")
		.uint16("framesOffset")
		.uint16("unknown")
		.uint16("version")
		.uint16("numBalls")
		.array("unknown2", {
			type: "uint8",
			length: 30
		})
		.array("ballSizes", {
			type: "uint16le",
			length: "numBalls"
		})
		
		.array("unknown3", {
			type: "uint8",
			length: function() {
				// Babyz has an additional block of data we'll skip
				return this.version === 14 /* BHD_VERSION_BABYZ */ ? 160 : 0;
			}
		})
		
		.uint16("animationCount")
		.array("animationEndOffset", {
			type: "uint16le",
			length: "animationCount"
		}),
	
	BHTHeader = new Parser()
		.endianess("little")
		.uint32("fileLength")
		.uint16("version")
		.string("copyright", {
			zeroTerminated: true
		}),
	
	BHTBallPosition = new Parser()
		.endianess("little")
		.int16("x")
		.int16("y")
		.int16("z")
		.uint16("q1") //Ball size delta? Fuzz value? Who knows?
		.uint16("q2");

	BHTFrameHeader = numBalls => new Parser()
		.endianess("little")
		.int16("minx")
		.int16("miny")
		.int16("minz")
		.int16("maxx")
		.int16("maxy")
		.int16("maxz")
		.uint16("tag")
		.array("balls", {
			type: BHTBallPosition,
			length: numBalls
		});

class PetzBHT {
	constructor(bhd, animIndex, bhtRaw) {
		this.frames = [];
		
		let
			decoder = BHTFrameHeader(bhd.numBalls);
		
		for (let frameOffset of bhd.animationFrameOffsets[animIndex]) {
			this.frames.push(decoder.parse(bhtRaw.slice(frameOffset)));
		}
	}
}

class PetzBHD {
	constructor(bhdRaw) {
		const
			header = BHDHeader.parse(bhdRaw),
			frameData = bhdRaw.slice(header.framesOffset);
		
		// Bring the decoded fields of the header out as fields of this object
		for (let fieldName in header) {
			if (header.hasOwnProperty(fieldName)) {
				this[fieldName] = header[fieldName];
			}
		}
		
		this.animations = [];
		
		for (let i = 0; i < header.animationCount; i++) {
			let
				animationStartOffset, /* Index into the 4-byte entries */
				animationLength,
				animFrameOffsets;
			
			if (i === 0) {
				animationStartOffset = 0;
			} else {
				animationStartOffset = header.animationEndOffset[i - 1];
			}
			
			animationLength = header.animationEndOffset[i] - animationStartOffset;
			
			animFrameOffsets = new Parser()
				.endianess("little")
				.array("frameOffsets", {
					type: "uint32le",
					length: animationLength
				});
			
			animFrameOffsets = animFrameOffsets.parse(frameData.slice(animationStartOffset * 4));
			
			this.animations.push(animFrameOffsets.frameOffsets);
		}
	}
}

class PetzAnimationDecoder {

	constructor(bhdRaw) {
		let
			parsed = new PetzBHD(bhdRaw);
		
		this.numBalls = parsed.numBalls;
		this.ballSizes = parsed.ballSizes;
		this.animationFrameOffsets = parsed.animations;
		this.animations = [];
	}
	
	addAnimation(animIndex, bhtRaw) {
		this.animations[animIndex] = new PetzBHT(this, animIndex, bhtRaw);
	}
}

module.exports = PetzAnimationDecoder;