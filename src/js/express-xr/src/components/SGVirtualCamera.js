const { useUpdate, useThree, useRender } = require('../lib/react-three-fiber')
const React = require('react')
const { useEffect, useRef } = React

const SGVirtualCamera = ({ i, aspectRatio, ...props }) => {
  const virtualCamera = useRef(null)
  const renderTarget = useRef(null)
  const targetMesh = useRef(null)
  const hideArray = useRef([])

  const size = 0.5
  const padding = 0.05
  const resolution = 512

  const { gl, scene } = useThree()

  const ref = useUpdate(
    self => {
      self.rotation.x = 0
      self.rotation.z = 0
      self.rotation.y = props.rotation

      self.rotateX(props.tilt)
      self.rotateZ(props.roll)
    },
    [props.rotation, props.tilt, props.roll]
  )

  useEffect(() => {
    if (!renderTarget.current) {
      renderTarget.current = new THREE.WebGLRenderTarget(resolution * aspectRatio, resolution)
    }
  }, [])

  useEffect(() => {
    hideArray.current = []
    scene.traverse(child => {
      if (child.type === 'Line' || child.userData.type === 'virtual-camera') {
        hideArray.current.push(child)
      }
    })
  })

  useRender(() => {
    if (virtualCamera.current && renderTarget.current) {
      gl.vr.enabled = false

      hideArray.current.forEach(child => {
        child.visible = false
      })

      gl.render(scene, virtualCamera.current, renderTarget.current)
      gl.vr.enabled = true

      hideArray.current.forEach(child => {
        child.visible = true
      })
    }
  })

  return (
    <group userData={{ id: props.id, type: 'virtual-camera' }} position={[props.x, props.z, props.y]} ref={ref}>
      <mesh
        ref={targetMesh}
        userData={{ type: 'view' }}
        geometry={new THREE.PlaneGeometry(size * aspectRatio, size)}
        material={
          new THREE.MeshBasicMaterial({
            map: renderTarget.current ? renderTarget.current.texture : null,
            side: THREE.DoubleSide
          })
        }
      />
      <mesh
        position={[0, 0, -0.0275]}
        geometry={new THREE.BoxGeometry(size * aspectRatio + padding, size + padding, 0.05)}
        material={new THREE.MeshLambertMaterial({ color: new THREE.Color('gray'), transparent: true })}
      />
      <perspectiveCamera
        ref={virtualCamera}
        aspect={aspectRatio}
        fov={props.fov}
        near={0.01}
        far={1000}
        onUpdate={self => self.updateProjectionMatrix()}
      />
    </group>
  )
}

module.exports = SGVirtualCamera