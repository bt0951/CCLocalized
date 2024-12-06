function _updateMaterialCache(render: cc.RenderComponent, defines?: { key: string, val: boolean }[], propertys?: { key: string, val: any }[]) {
    //@ts-ignore
    const _materialCache = render._materialCache as { [key: string]: cc.MaterialVariant }
    if (_materialCache) {
        for (const key in _materialCache) {
            if (Object.prototype.hasOwnProperty.call(_materialCache, key)) {
                const element = _materialCache[key]
                defines?.forEach(e => {
                    element.define(e.key, e.val)
                })
                propertys?.forEach(e => {
                    element.setProperty(e.key, e.val)
                })
            }
        }
    }
}

function updateMaterialCache(render: cc.RenderComponent, material: cc.Material, defines?: { key: string, val: boolean }[], propertys?: { key: string, val: any }[], delay = false) {
    if (cc.sys.isNative) {
        render.setMaterial(0, material)
    }
    else {
        if (delay) {
            render.scheduleOnce(() => {
                _updateMaterialCache(render, defines, propertys)
            })
        }
        else {
            _updateMaterialCache(render, defines, propertys)
        }
    }
}

function updateSkeletonMaterial(render: cc.RenderComponent, material: cc.Material, defines?: { key: string, val: boolean }[], propertys?: { key: string, val: any }[], delay = false) {
    if (!material) {
        return
    }
    if (!render.isValid) {
        return
    }
    defines?.forEach(e => {
        material.define(e.key, e.val)
    })
    propertys?.forEach(e => {
        material.setProperty(e.key, e.val)
    })

    updateMaterialCache(render, material, defines, propertys, delay)
}

export namespace ShaderUtils {

    const baseMatPath = "material/"

    function loadMaterialAsync(path: string, callback: (asset?: cc.Material | null) => void) {
        cc.resources.load<cc.Material>(path, null, (error, asset) => {
            if (error) {
                callback(null)
                console.error(error)
            }
            else {
                callback(asset)
            }
        })
    }

    export function applyMaterial(render: cc.RenderComponent, name: string, callback: (asset?: cc.Material) => void) {
        const mat = render.getMaterial(0)
        const matName = mat.name//.split(" ")[0]
        if (matName.includes(name)) {
            callback?.(mat)
        }
        else {
            loadMaterialAsync(baseMatPath + name, material => {
                if (render.isValid) {
                    const mat = render.setMaterial(0, material)
                    callback?.(mat)
                }
            })
        }
    }

    /**
     * 角色shader
     * @param render 渲染组件
     * @returns 
     */
    export function applyCharacterMaterial(render: cc.RenderComponent, callback?: (asset?: cc.Material) => void) {
        applyMaterial(render, "character", callback)
    }

    /**
     * 冰冻效果
     * @param render 渲染组件
     * @param duration 持续时间
     */
    export function frozen(render: cc.RenderComponent, duration: number) {
        if (render instanceof sp.Skeleton) {
            render.timeScale = 0
        }
        applyCharacterMaterial(render, material => {
            updateSkeletonMaterial(render, material, [{ key: "ICE_TEXTURE", val: true }, { key: "FROZEN_ON", val: true }])
        })

        render.scheduleOnce(() => {
            unFrozen(render)
        }, duration)
    }

    /**
     * 解冻
     * @param render 渲染组件
     */
    export function unFrozen(render: cc.RenderComponent) {
        if (!render || !render.isValid) {
            return
        }
        if (render instanceof sp.Skeleton) {
            render.timeScale = 1
        }
        var material = render.getMaterial(0)
        updateSkeletonMaterial(render, material, [{ key: "ICE_TEXTURE", val: false }, { key: "FROZEN_ON", val: false }])
    }

    /**
     * 受击效果
     * @param render 渲染组件
     * @param duration 持续时间
     */
    export function hurt(render: cc.RenderComponent, duration: number = 0.1) {
        const color = cc.Color.WHITE
        color.a = 153
        applyCharacterMaterial(render, (material) => {

            updateSkeletonMaterial(render, material, [{ key: "HURT_ON", val: true }], [{ key: "hurtColor", val: color }])

            cc.tween(color)
                .to(duration, { a: 0 }, {
                    easing: cc.easing.circIn,
                    onUpdate: () => {
                        material.setProperty("hurtColor", color)
                        updateSkeletonMaterial(render, material, null, [{ key: "hurtColor", val: color }])
                    }
                })
                .call(() => {
                    updateSkeletonMaterial(render, material, [{ key: "HURT_ON", val: false }])
                })
                .start()
        })
    }

    /**
     * 溶解
     * @param render 渲染组件
     * @param bodyScale 大小缩放
     * @param duration 持续时间
     */
    export function dissolveCharacter(render: cc.RenderComponent, duration: number) {
        applyCharacterMaterial(render, (material) => {
            updateSkeletonMaterial(render, material, [{ key: "DISSOLVE_ON", val: true }])

            const target = { dissolveThreshold: 0 }
            cc
                .tween(target)
                .to(duration, { dissolveThreshold: 1 }, {
                    easing: cc.easing.circOut,
                    onUpdate: (t: typeof target) => {
                        updateSkeletonMaterial(render, material, null, [{ key: "dissolveThreshold", val: t.dissolveThreshold }])
                    }
                })
                .start()

        })
    }

    /**
     * 反向溶解
     * @param render 
     * @param duration 
     */
    export function dissolveReverseCharacter(render: cc.RenderComponent, duration: number) {
        applyCharacterMaterial(render, (material) => {
            updateSkeletonMaterial(render, material, [{ key: "DISSOLVE_ON", val: true }])

            const target = { dissolveThreshold: 1 }
            cc
                .tween(target)
                .to(duration, { dissolveThreshold: 0 }, {
                    easing: cc.easing.sineOut,
                    onUpdate: (t: typeof target) => {
                        updateSkeletonMaterial(render, material, null, [{ key: "dissolveThreshold", val: t.dissolveThreshold }])
                    }
                })
                .start()
        })
    }

    export function _dissolve(render: cc.RenderComponent, val: number) {
        applyCharacterMaterial(render, (material) => {
            updateSkeletonMaterial(render, material, [{ key: "DISSOLVE_ON", val: true }], [{ key: "dissolveThreshold", val }])
        })
    }

    export function spriteAblation(render: cc.Sprite, duration = 2) {
        if (!render?.isValid) {
            return
        }
        const material = render.getMaterial(0)
        if (!material.name.includes("ablation")) {
            return
        }
        let _duration = 0
        const doDissolve = () => {
            _duration += 1 / 30
            material.setProperty("noiseThreshold", _duration / duration)
            if (_duration >= duration) {
                render.unschedule(doDissolve)
            }
        }
        render.schedule(doDissolve)
    }

    export function ghost(render: cc.RenderComponent) {
        const color = cc.Color.WHITE.fromHEX("#A9EEF9")
        color.a = 128
        glow(render, color)
    }

    /**
     * 内发光
     * @param render 渲染组件
     * @param color 发光颜色
     * @param width 大小
     */
    export function innerGlow(render: cc.RenderComponent, color: cc.Color, width = 0.02) {
        applyCharacterMaterial(render, (material) => {

            updateSkeletonMaterial(
                render,
                material,
                [{ key: "INNER_GLOW_ON", val: true }],
                [{ key: "innerWidth", val: width }, { key: "innerColor", val: color }]
            )
        })
    }

    /**
     * 虚化发光
     * @param render 
     * @param color 
     */
    export function glow(render: cc.RenderComponent, color: cc.Color) {
        render.node.opacity = color.a
        applyCharacterMaterial(render, (material) => {

            updateSkeletonMaterial(
                render,
                material,
                [{ key: "ADD_GLOW_ON", val: true }],
                [{ key: "addGlowColor", val: color }],
                true
            )
        })
    }

    export function addGlow(render: cc.RenderComponent, color: cc.Color) {
        applyCharacterMaterial(render, (material) => {

            updateSkeletonMaterial(
                render,
                material,
                [{ key: "ADD_GLOW_ON", val: true }],
                [{ key: "addGlowColor", val: color }],
                true
            )
        })
    }

    export function unAddGlow(render: cc.RenderComponent) {
        const material = render.getMaterial(0)
        material.define("ADD_GLOW_ON", false)

        updateSkeletonMaterial(render, material, [{ key: "ADD_GLOW_ON", val: false }])
    }

    export function unInnerGlow(render: cc.RenderComponent) {
        const material = render.getMaterial(0)
        material.define("INNER_GLOW_ON", false)

        updateSkeletonMaterial(render, material, [{ key: "INNER_GLOW_ON", val: false }])
    }

    export function additiveTexture(render: cc.RenderComponent, color: cc.Color, intensity: number = 1.0) {
        applyMaterial(render, "additive-texture", (material) => {
            if (material) {
                material.setProperty("lightColor", color)
                material.setProperty("intensity", intensity)
            }
        })
    }

    export function blur(render: cc.Sprite, offset = 1) {
        applyMaterial(render, "gauss-blur", (material) => {
            if (material) {
                const texture = render.spriteFrame.getTexture()
                material.setProperty("resolution", cc.v2(texture.width, texture.height))
                // material.setProperty("resolution", cc.v2(Math.floor(render.node.width), Math.floor(render.node.height)))
                // material.setProperty("offset", offset)
            }
        })
    }

    export function updateShadow(render: cc.Sprite, alpha: number, intenSity: number) {
        applyMaterial(render, "shadow", material => {
            if (material) {
                material.setProperty("shadowAlpha", alpha);
                material.setProperty("shadowIntensity", intenSity);
            }
        })
    }

    export function gray(render: cc.RenderComponent) {
        const mat = cc.Material.getBuiltinMaterial("2d-gray-sprite")
        render.setMaterial(0, mat)
    }

    export function spriteNomal(render: cc.Sprite) {
        const mat = cc.Material.getBuiltinMaterial("2d-sprite")
        render.setMaterial(0, mat)
    }
}