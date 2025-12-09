export class Xoshiro256ss {

    constructor(seedArray) {
        if (!Array.isArray(seedArray) || seedArray.length !== 4) {
            throw new Error("seedArray must be an array of 4 BigInt values.");
        }
        this.state = seedArray.map(BigInt);
    }

    static splitmix64(seed) {
        seed = BigInt.asUintN(64, seed + 0x9e3779b97f4a7c15n);
        let z = seed;
        z = (z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n;
        z = (z ^ (z >> 27n)) * 0x94d049bb133111ebn;
        return z ^ (z >> 31n);
    }

    static fromSeed(seed) {
        let x = BigInt(seed) & 0xffff_ffffn;
        const s0 = Xoshiro256ss.splitmix64(x);
        const s1 = Xoshiro256ss.splitmix64(s0);
        const s2 = Xoshiro256ss.splitmix64(s1);
        const s3 = Xoshiro256ss.splitmix64(s2);

        return new Xoshiro256ss([s0, s1, s2, s3]);
    }

    next64() {
        const s = this.state;

        const result = BigInt.asUintN(64, (s[1] * 5n) << 7n) * 9n;

        let t = BigInt.asUintN(64, s[1] << 17n);

        s[2] ^= s[0];
        s[3] ^= s[1];
        s[1] ^= s[2];
        s[0] ^= s[3];
        s[2] ^= t;

        // rotate left 45
        s[3] = BigInt.asUintN(64, (s[3] << 45n) | (s[3] >> (64n - 45n)));

        return BigInt.asUintN(64, result);
    }

    // 0〜1未満の double を返す
    random() {
        const x = this.next64();
        return Number(x >> 11n) / (2 ** 53); // IEEE754 double の有効ビット 53 に合わせる
    }

    /**
     * 
     * @param {number} max -最大値 
     * @returns 0~max
     */
    randomInt(max = 0) {
        return Math.floor(rng.random() * (max + 1));
    }
}
