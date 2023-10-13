import fs from "fs"

import {PNG} from "pngjs"

// PNG = require("pngjs").PNG;


/*fs.createReadStream("in.png")
	.pipe(
		new PNG({
			filterType: 4,
		})
	)
	.on("parsed", function () {
		let msg = "hello world"
		let msg_bitarray = []
		for (let i = 0; i < msg.length; i++) {
			let letter = msg.charCodeAt(i)
			let bitarray = []
			for(let j = 0; j < 8; j++){
				let bit = ((letter & (1 << j)) >> j)
				// console.log(bit, 1 << j)
				bitarray[8 - j - 1] = bit
			}
			console.log(bitarray)
			console.log('-------')
			msg_bitarray = msg_bitarray.concat(bitarray)
		}
		console.log("FINAL BITARRAY", msg_bitarray)
		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				let idx = (this.width * y + x) << 2; // N of pixels * 4
				//[r, g, b, a]
				let bit = msg_bitarray[idx % msg_bitarray.length]
				if(bit)
					this.data[idx + 3] >>= 1;
			}
		}

		this.pack().pipe(fs.createWriteStream("out.png"));
	});*/

console.log(process.argv.indexOf('-i'))

const setArgvVal = (flag, obj, fieldName, dontParse = false) => {
	const idx = process.argv.indexOf(flag)
	if(idx !== -1){
		let val = process.argv[idx+1]
		if(!dontParse && !isNaN(parseInt(val)))
			val = parseInt(val)
		obj[fieldName] = val
	}
}

let args = {
	in_filename: "in.png",
	out_filename: "out.png",
	msg: "hello world",
	radius: 0,
	space: 0,
	pause: 0,
	aspectMod: "./aspectMod.mjs"
}

let flag2field = [
	["-i", "in_filename"],
	["-o", "out_filename"],
	['-a', "aspectMod"],
	["-m", "msg"],
	["-r", "radius"],
	["-s", "space"],
	["-p", "pause"],
	["--in", "in_filename"],
	["--out", "out_filename"],
	["--msg", "msg"],
	["--radius", "radius"],
	["--space", "space"],
	["--pause", "pause"],
	["--aspectmod", "aspectMod"]
]

flag2field.forEach((pair) => {
	setArgvVal(pair[0], args, pair[1], (pair[0] === '-m'))
})

let { modify }= await import(args.aspectMod)
let rad = args.radius

console.log(args)

const packPx = (arr, idx) => {
	let res = []
	for(let i of [...Array(5).keys()])
		res.push(arr[idx+i])
	return res
}

const unpackPx = (arr, idx, px) => {
	for(let i of [...Array(5).keys()])
		arr[idx+i] = px[i]
}

fs.createReadStream(args.in_filename)
	.pipe(
		new PNG({
			filterType: 4,
		})
	)
	.on("parsed", function () {
		let msg_bitarray = []
		let msg_bitarray_idx = 0
		for (let i = 0; i < args.msg.length; i++) {
			let letter = args.msg.charCodeAt(i)
			let bitarray = []
			for(let j = 0; j < 8; j++){
				let bit = ((letter & (1 << j)) >> j)
				// console.log(bit, 1 << j)
				bitarray[8 - j - 1] = bit
			}
			// console.log(bitarray)
			// console.log('-------')
			msg_bitarray = msg_bitarray.concat(bitarray)
		}
		// console.log("FINAL BITARRAY", msg_bitarray)
		let end_flag = false
		let dist = rad<<1
		let space = (rad * args.space)<<1

		console.log("Distance: ", dist)
		console.log("Space: ", space)

		for (let y = rad; y < this.height; y+=1 + (dist + space)) {
			for (let x = rad; x < this.width; x+=1 + dist) {
				//[r, g, b, a]
				let idx = (this.width * y + x) << 2; // N of pixels * 4
				let bottom = idx + (this.width << 2);
				if(bottom < this.height){
					end_flag = true
					break
				}
				if(msg_bitarray_idx < msg_bitarray.length) {
					let bit = msg_bitarray[msg_bitarray_idx]
					if (bit) {
						for (let yr = (-rad); yr <= rad; yr++) {
							for (let xr = (-rad); xr <= rad; xr++) {
								let pos = idx + ((xr + (yr * this.width)) << 2)

								unpackPx(this.data, pos, modify(packPx(this.data, pos)))

								// this.data[pos + 3] -= 50 /*>>= 1*/
							}
						}
					}
				}
				// console.log(`${y} ${x} : ${bit}, ${msg_bitarray_idx}`)
				msg_bitarray_idx++
				if(msg_bitarray_idx + 1 > msg_bitarray.length + args.pause){
					msg_bitarray_idx = 0
					// args.pause = Math.random() * 100
				}
			}
			if(end_flag)
				break
		}

		this.pack().pipe(fs.createWriteStream(args.out_filename));
	});


