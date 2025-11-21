
// ONTO-TRON-5000 — this is the full frontend UI

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  memo,
} from "react";
import Papa from "papaparse";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  Position,
  Handle,
  addEdge,
  NodeResizer,
  applyEdgeChanges,
  applyNodeChanges,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";

//Style stuff

const retroTheme = {
  button: {
    background: "linear-gradient(180deg, #ffffff 0%, #e5e5e5 45%, #d4d4d4 50%, #c8c8c8 100%)",
    border: "2px solid",
    borderColor: "#ffffff #808080 #808080 #ffffff",
    padding: "5px 12px",
    margin: "2px",
    cursor: "pointer",
    fontWeight: 600,
    fontFamily: "Tahoma, 'Segoe UI', Geneva, Verdana, sans-serif",
    fontSize: "11px",
    color: "#000000",
    textShadow: "1px 1px 0px rgba(255,255,255,0.8)",
    boxShadow: "inset -1px -1px 0px rgba(0,0,0,0.25), inset 1px 1px 0px rgba(255,255,255,0.8)",
    userSelect: "none",
  },
  dangerButton: {
    background: "linear-gradient(180deg, #ffdddd 0%, #ffcccc 45%, #ffbbbb 50%, #ffaaaa 100%)",
    border: "2px solid",
    borderColor: "#ffffff #aa6666 #aa6666 #ffffff",
    padding: "5px 12px",
    margin: "2px",
    cursor: "pointer",
    fontWeight: 600,
    fontFamily: "Tahoma, 'Segoe UI', Geneva, Verdana, sans-serif",
    fontSize: "11px",
    color: "#660000",
    textShadow: "1px 1px 0px rgba(255,255,255,0.6)",
    boxShadow: "inset -1px -1px 0px rgba(0,0,0,0.25), inset 1px 1px 0px rgba(255,255,255,0.8)",
    userSelect: "none",
  },
  modal: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: "#c0c0c0",
    border: "2px solid",
    borderColor: "#ffffff #000000 #000000 #ffffff",
    padding: "2px",
    zIndex: 10000,
    width: "420px",
    maxWidth: "90vw",
    boxShadow: "2px 2px 4px rgba(0,0,0,0.5), inset 1px 1px 0px #ffffff, inset -1px -1px 0px #808080",
  },
  modalHeader: {
    background: "linear-gradient(90deg, #000080 0%, #1084d0 100%)",
    color: "#ffffff",
    padding: "3px 6px",
    fontWeight: "bold",
    fontSize: "11px",
    fontFamily: "Tahoma, 'Segoe UI', Geneva, Verdana, sans-serif",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    userSelect: "none",
  },
  modalContent: {
    background: "#c0c0c0",
    padding: "8px",
    border: "2px solid",
    borderColor: "#808080 #ffffff #ffffff #808080",
  },
  input: {
    width: "100%",
    marginBottom: "6px",
    padding: "4px",
    border: "2px solid",
    borderColor: "#000000 #ffffff #ffffff #000000",
    fontSize: "11px",
    fontFamily: "Tahoma, 'Segoe UI', Geneva, Verdana, sans-serif",
    background: "#ffffff",
    boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.2)",
  },
  listItem: {
    padding: "6px 8px",
    borderBottom: "1px solid #808080",
    cursor: "pointer",
    fontSize: "11px",
    fontFamily: "Tahoma, 'Segoe UI', Geneva, Verdana, sans-serif",
  },
  tableHeader: {
    background: "linear-gradient(180deg, #ffffff 0%, #e5e5e5 45%, #d4d4d4 50%, #c8c8c8 100%)",
    border: "1px solid #808080",
    padding: "4px",
    fontWeight: "600",
    fontSize: "11px",
    fontFamily: "Tahoma, 'Segoe UI', Geneva, Verdana, sans-serif",
    textAlign: "center",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  tableCell: {
    border: "1px solid #c0c0c0",
    padding: "3px 6px",
    fontSize: "11px",
    fontFamily: "Tahoma, 'Segoe UI', Geneva, Verdana, sans-serif",
    background: "#ffffff",
  },
};


// Utility Functions

const uid = (() => {
  let counter = 0;
  return (prefix = "id") => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${++counter}-${timestamp}-${random}`;
  };
})();

const tail = (uri) => {
  if (!uri) return "(unnamed)";
  const parts = String(uri).split(/[#\/]/);
  return parts[parts.length - 1] || "(unnamed)";
};

const isBFOorCCO = (uri) => {
  if (!uri) return false;
  const uriLower = String(uri).toLowerCase();
  return (
    uriLower.includes("/obo/bfo_") ||
    uriLower.includes("commoncoreontologies") ||
    uriLower.includes("/cco/")
  );
};

const RDF_TYPE = {
  uri: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
  label: "rdf:type (Instance Of)",
};

const fallbackProperties = [
  RDF_TYPE,
  { uri: "http://purl.obolibrary.org/obo/BFO_0000051", label: "bfo:has_part" },
  { uri: "http://purl.obolibrary.org/obo/BFO_0000050", label: "bfo:part_of" },
  { uri: "http://purl.obolibrary.org/obo/RO_0002233", label: "ro:has_input" },
  { uri: "http://purl.obolibrary.org/obo/RO_0002234", label: "ro:has_output" },
  { uri: "http://www.ontologyrepository.com/CommonCoreOntologies/designated_by", label: "cco:designated_by" },
  { uri: "http://www.ontologyrepository.com/CommonCoreOntologies/designates", label: "cco:designates" },
  { uri: "http://www.ontologyrepository.com/CommonCoreOntologies/has_agent", label: "cco:has_agent" },
  { uri: "http://www.ontologyrepository.com/CommonCoreOntologies/agent_in", label: "cco:agent_in" },
];

// Custom clickable node components

const ClickableNode = memo(({ data, id, selected }) => {

    const handleClick = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log("🎯 Node clicked:", id);
    if (typeof data?.__open === "function") {
      data.__open(e, { id, data });
    }
  }, [data, id]);

  return (
    <>
      {selected && (
        <NodeResizer
          color="#ff6600"
          isVisible={true}
          minWidth={100}
          minHeight={40}
          handleStyle={{
            width: 12,
            height: 12,
            borderRadius: 2,
            backgroundColor: "#ff6600",
            border: "2px solid white",
          }}
          lineStyle={{
            borderWidth: 2,
            borderColor: "#ff6600",
          }}
        />
      )}
      <div
        onMouseDown={handleClick}
        style={{
          border: selected ? "3px solid #ff6600" : "2px solid #0044cc",
          borderRadius: "6px",
          background: selected 
            ? "linear-gradient(180deg, #fff8e0 0%, #ffeecc 100%)" 
            : "#ffffff",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "8px",
          fontSize: "12px",
          color: "#001a66",
          boxShadow: selected 
            ? "0 0 0 2px rgba(255,102,0,0.3), 2px 2px 6px rgba(0,0,0,0.3)"
            : "2px 2px 4px rgba(0,0,0,0.2)",
          cursor: "pointer",
          userSelect: "none",
          position: "relative",
          pointerEvents: "all",
        }}
      >
        <Handle
  type="target"
  position={Position.Left}
  id="left"
  style={{ width: 8, height: 8, background: "#0044cc" }}
/>
<Handle
  type="source"
  position={Position.Left}
  id="left-source"
  style={{ width: 8, height: 8, background: "#0044cc" }}
/>
<Handle
  type="target"
  position={Position.Top}
  id="top"
  style={{ width: 8, height: 8, background: "#0044cc" }}
/>
<Handle
  type="source"
  position={Position.Top}
  id="top-source"
  style={{ width: 8, height: 8, background: "#0044cc" }}
/>
<Handle
  type="target"
  position={Position.Right}
  id="right"
  style={{ width: 8, height: 8, background: "#0044cc" }}
/>
<Handle
  type="source"
  position={Position.Right}
  id="right-source"
  style={{ width: 8, height: 8, background: "#0044cc" }}
/>
<Handle
  type="target"
  position={Position.Bottom}
  id="bottom"
  style={{ width: 8, height: 8, background: "#0044cc" }}
/>
<Handle
  type="source"
  position={Position.Bottom}
  id="bottom-source"
  style={{ width: 8, height: 8, background: "#0044cc" }}
/>
        <div style={{ 
          wordWrap: "break-word", 
          overflow: "hidden",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          {data.label || tail(data.uri)}
        </div>
        {data.isCustom && (
          <div style={{
            position: "absolute",
            top: "2px",
            right: "2px",
            background: "#ffcc00",
            color: "#000000",
            fontSize: "8px",
            padding: "1px 3px",
            borderRadius: "2px",
            fontWeight: "bold",
          }}>
            CUSTOM
          </div>
        )}
      </div>
    </>
  );
});

ClickableNode.displayName = "ClickableNode";

const nodeTypes = { clickable: ClickableNode };

// Custom edge components with forced labels
const LabeledEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  markerEnd,
  style,
}) => {

  if (!Number.isFinite(sourceX) || !Number.isFinite(sourceY) || 
      !Number.isFinite(targetX) || !Number.isFinite(targetY)) {
    console.warn('Invalid edge coordinates:', { id, sourceX, sourceY, targetX, targetY });
    return null;
  }

  try {
    const edgePath = `M ${sourceX},${sourceY} C ${sourceX + 50},${sourceY} ${targetX - 50},${targetY} ${targetX},${targetY}`;
    const labelX = (sourceX + targetX) / 2;
    const labelY = (sourceY + targetY) / 2;

    return (
      <>
        <path
          id={id}
          className="react-flow__edge-path"
          d={edgePath}
          style={style}
          markerEnd={markerEnd}
        />
        {label && (
          <g transform={`translate(${labelX}, ${labelY})`}>
            <rect
              x={-40}
              y={-12}
              width={80}
              height={24}
              fill="#ffffff"
              stroke="#000080"
              strokeWidth={2}
              rx={4}
            />
            <text
              x={0}
              y={4}
              textAnchor="middle"
              fill="#000080"
              fontSize={13}
              fontWeight={700}
              fontFamily="Tahoma, sans-serif"
            >
              {label}
            </text>
          </g>
        )}
      </>
    );
  } catch (err) {
    console.error('Error rendering edge:', err);
    return null;
  }
};

const edgeTypes = {
  smoothstep: LabeledEdge,
};


export default function App() {

  // CSV Data State
 
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [rowsShown, setRowsShown] = useState(50);
  const visibleData = useMemo(() => csvData.slice(0, rowsShown), [csvData, rowsShown]);

  
  // Graph State

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [headerLinks, setHeaderLinks] = useState([]);
  const [mappings, setMappings] = useState({});
  const [propertyResults, setPropertyResults] = useState([]);
  const [dataPropertyResults, setDataPropertyResults] = useState([]);

  // Stabilize edges to stop flashing 
  const stableEdges = useMemo(() => edges, [edges]);

  
  // Modal State

  const [activeHeader, setActiveHeader] = useState(null);
  const [headerSearchTerm, setHeaderSearchTerm] = useState("");
  const [headerSearchResults, setHeaderSearchResults] = useState([]);
  const [headerIsSearching, setHeaderIsSearching] = useState(false);

  const [showNodeClassModal, setShowNodeClassModal] = useState(false);
  const [nodeClassSearchTerm, setNodeClassSearchTerm] = useState("");
  const [nodeClassResults, setNodeClassResults] = useState([]);
  const [nodeClassIsSearching, setNodeClassIsSearching] = useState(false);
  const [showExistingNodeModal, setShowExistingNodeModal] = useState(false);


  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const [customDef, setCustomDef] = useState("");
  const [customParentSearch, setCustomParentSearch] = useState("");
  const [customParentResults, setCustomParentResults] = useState([]);
  const [customParentIsSearching, setCustomParentIsSearching] = useState(false);
  const [customParentPicked, setCustomParentPicked] = useState(null);

  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showHeaderPropertyModal, setShowHeaderPropertyModal] = useState(false);
  const [propertyModalMode, setPropertyModalMode] = useState(null);
  const [propertySearchTerm, setPropertySearchTerm] = useState("");
  const [propertyModalTab, setPropertyModalTab] = useState("dataProperties");
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [chosenProperty, setChosenProperty] = useState(null);
  const [selectedTargetNodeId, setSelectedTargetNodeId] = useState("");

  const [selectedNode, setSelectedNode] = useState(null);
  const [showNodeOptions, setShowNodeOptions] = useState(false);
  
  const [edgeContext, setEdgeContext] = useState(null);
  const [edgeBeingEdited, setEdgeBeingEdited] = useState(null);

  const [pendingHeader, setPendingHeader] = useState(null);
  const [pendingNodeClass, setPendingNodeClass] = useState(null);

  const [toast, setToast] = useState(null);

  // For property list UX hints (shown/total)
  const [propFilterInfo, setPropFilterInfo] = useState({ shown: 0, total: 0 });

  // Ontology Browser Panel State
const [showBrowserPanel, setShowBrowserPanel] = useState(false);
const [browserPanelWidth, setBrowserPanelWidth] = useState(33); // percentage
const [browserActiveTab, setBrowserActiveTab] = useState("classes");
const [browserExpandedClasses, setBrowserExpandedClasses] = useState(new Set());
const [browserClassHierarchy, setBrowserClassHierarchy] = useState([]);
const [browserObjectProperties, setBrowserObjectProperties] = useState([]);
const [browserDataProperties, setBrowserDataProperties] = useState([]);
const [browserSelectedClass, setBrowserSelectedClass] = useState(null);
const [browserSelectedProperty, setBrowserSelectedProperty] = useState(null);
const [browserIsResizing, setBrowserIsResizing] = useState(false);
const [browserClassDetails, setBrowserClassDetails] = useState({});
const [browserPropertyDetails, setBrowserPropertyDetails] = useState({});

const [showMermaidModal, setShowMermaidModal] = useState(false);
const [mermaidSyntax, setMermaidSyntax] = useState("");
  // ============================================================================
  // Refs
  // ============================================================================
  const rootRef = useRef(null);
  const tableScrollRef = useRef(null);
  const tableRef = useRef(null);
  const canvasApiRef = useRef(null);
  const latestNodesRef = useRef(nodes);
  
  useEffect(() => {
    latestNodesRef.current = nodes;
  }, [nodes]);

  // ============================================================================
  // Load Object Properties on Mount
  // ============================================================================
  useEffect(() => {
    let isMounted = true;
    
    const loadProperties = async () => {
      try {
        // Load object properties
        const objResponse = await fetch("/object_properties");
        const objData = await objResponse.json().catch(() => null);
        
        let objProperties = [];
        if (Array.isArray(objData)) {
          objProperties = objData;
        } else if (objData?.results && Array.isArray(objData.results)) {
          objProperties = objData.results;
        }

        const objFiltered = objProperties.filter(p => isBFOorCCO(p?.uri));
        const withRdfType = [RDF_TYPE, ...objFiltered];
        
        // Load data properties
        const dataResponse = await fetch("/data_properties");
        const dataData = await dataResponse.json().catch(() => null);
        
        let dataProperties = [];
        if (Array.isArray(dataData)) {
          dataProperties = dataData;
        } else if (dataData?.results && Array.isArray(dataData.results)) {
          dataProperties = dataData.results;
        }

        const dataFiltered = dataProperties.filter(p => isBFOorCCO(p?.uri));
        
        console.log("📊 Loaded object properties:", withRdfType.length);
        console.log("📊 Loaded data properties:", dataFiltered.length);
        
        if (isMounted) {
          setPropertyResults(withRdfType.length ? withRdfType : fallbackProperties);
          setDataPropertyResults(dataFiltered);
        }
      } catch (error) {
        console.error("Failed to load properties:", error);
        if (isMounted) {
          setPropertyResults(fallbackProperties);
          setDataPropertyResults([]);
        }
      }
    };

    loadProperties();
    return () => { isMounted = false; };
  }, []);

  // ============================================================================
  // Search Effects
  // ============================================================================
  useEffect(() => {
    if (!activeHeader) return;
    
    const timer = setTimeout(async () => {
      if (!headerSearchTerm || headerSearchTerm.trim().length < 2) {
        setHeaderSearchResults([]);
        setHeaderIsSearching(false);
        return;
      }
      
      setHeaderIsSearching(true);
      try {
        const response = await fetch(`/ontology_search?term=${encodeURIComponent(headerSearchTerm)}`);
        const data = await response.json().catch(() => null);
        let results = Array.isArray(data) ? data : (data?.results || []);
        const filtered = results.filter(x => isBFOorCCO(x?.uri));
        setHeaderSearchResults(filtered);
      } catch (error) {
        console.error("Search error:", error);
        setHeaderSearchResults([]);
      } finally {
        setHeaderIsSearching(false);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [activeHeader, headerSearchTerm]);

  useEffect(() => {
    if (!showNodeClassModal) return;
    
    const timer = setTimeout(async () => {
      if (!nodeClassSearchTerm || nodeClassSearchTerm.trim().length < 2) {
        setNodeClassResults([]);
        setNodeClassIsSearching(false);
        return;
      }
      
      setNodeClassIsSearching(true);
      try {
        const response = await fetch(`/ontology_search?term=${encodeURIComponent(nodeClassSearchTerm)}`);
        const data = await response.json().catch(() => null);
        let results = Array.isArray(data) ? data : (data?.results || []);
        const filtered = results.filter(x => isBFOorCCO(x?.uri));
        setNodeClassResults(filtered);
      } catch (error) {
        console.error("Search error:", error);
        setNodeClassResults([]);
      } finally {
        setNodeClassIsSearching(false);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [showNodeClassModal, nodeClassSearchTerm]);

  useEffect(() => {
    if (!showCustomModal) return;
    
    const timer = setTimeout(async () => {
      if (!customParentSearch || customParentSearch.trim().length < 2) {
        setCustomParentResults([]);
        setCustomParentIsSearching(false);
        return;
      }
      
      setCustomParentIsSearching(true);
      try {
        const response = await fetch(`/ontology_search?term=${encodeURIComponent(customParentSearch)}`);
        const data = await response.json().catch(() => null);
        let results = Array.isArray(data) ? data : (data?.results || []);
        const filtered = results.filter(x => isBFOorCCO(x?.uri));
        setCustomParentResults(filtered);
      } catch (error) {
        console.error("Search error:", error);
        setCustomParentResults([]);
      } finally {
        setCustomParentIsSearching(false);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [showCustomModal, customParentSearch]);

  // ============================================================================
  // Object Property filtering (de-dupe, limit size, light throttle)
  // ============================================================================
  useEffect(() => {
    // Tiny throttle to avoid rapid keystroke thrash
    const throttle = setTimeout(() => {
      // Use object or data properties based on modal tab
      const sourceProps = propertyModalTab === "dataProperties" 
        ? (Array.isArray(dataPropertyResults) ? dataPropertyResults : [])
        : (Array.isArray(propertyResults) ? propertyResults : []);
      
      const baseProps = sourceProps;
      const allProps = propertyModalTab === "dataProperties"
        ? baseProps.filter(p => p?.uri)
        : [RDF_TYPE, ...baseProps.filter(p => p?.uri && p.uri !== RDF_TYPE.uri)];

      // De-dupe by URI
      const seen = new Set();
      const deduped = [];
      for (const p of allProps) {
        if (!p?.uri || seen.has(p.uri)) continue;
        seen.add(p.uri);
        // Normalize shape: ensure label/uri strings
        deduped.push({
          uri: String(p.uri),
          label: String(p.label ?? tail(p.uri)),
        });
      }

      const searchTerm = (propertySearchTerm || "").trim().toLowerCase();
      let filtered = deduped;
      if (searchTerm) {
        filtered = deduped.filter(prop =>
          (prop.label || "").toLowerCase().includes(searchTerm) ||
          (prop.uri || "").toLowerCase().includes(searchTerm)
        );
      }

      // Cap list to keep modal snappy
      const MAX = 300;
      const limited = filtered.slice(0, MAX);

      setFilteredProperties(limited);
      setPropFilterInfo({ shown: limited.length, total: filtered.length });
    }, 120);

    return () => clearTimeout(throttle);
  }, [propertyResults, dataPropertyResults, propertySearchTerm, propertyModalTab]);

// ============================================================================
// Load Class Hierarchy for Browser Panel
// ============================================================================
useEffect(() => {
  const loadClassHierarchy = async () => {
    console.log("📥 Loading class hierarchy...");
    try {
      const response = await fetch("/classes");
      const data = await response.json();
      
      if (!data) {
        console.error("📥 No data returned");
        return;
      }
      
      const classes = Array.isArray(data) ? data : (data.results || []);
      console.log("📥 Total classes:", classes.length);
      
      const filtered = classes.filter(c => isBFOorCCO(c?.uri));
      console.log("📥 Filtered BFO/CCO classes:", filtered.length);
      
      const tree = buildClassTree(filtered);
      console.log("📥 Class tree built");
      setBrowserClassHierarchy(tree);
    } catch (error) {
      console.error("📥 Failed to load class hierarchy:", error);
    }
  };

  if (showBrowserPanel && browserClassHierarchy.length === 0) {
    loadClassHierarchy();
  }
}, [showBrowserPanel, browserClassHierarchy.length]);

// ============================================================================
// Load Object Property Hierarchy for Browser Panel
// ============================================================================
useEffect(() => {
  const loadPropertyHierarchy = async () => {
    console.log("📥 Loading property hierarchy...");
    try {
      const response = await fetch("/object_properties");
      const data = await response.json();
      
      if (!data) {
        console.error("📥 No property data returned");
        return;
      }
      
      const properties = Array.isArray(data) ? data : [];
      console.log("📥 Total properties:", properties.length);
      
      const filtered = properties.filter(p => isBFOorCCO(p?.uri));
      console.log("📥 Filtered BFO/CCO properties:", filtered.length);
      
      const tree = buildClassTree(filtered); // Reuse the same tree builder
      console.log("📥 Property tree built");
      setBrowserObjectProperties(tree);
    } catch (error) {
      console.error("📥 Failed to load property hierarchy:", error);
    }
  };

  const loadDataPropertyHierarchy = async () => {
    console.log("📥 Loading data property hierarchy...");
    try {
      const response = await fetch("/data_properties");
      const props = await response.json();
      
      console.log(`📥 Total data properties: ${props.length}`);
      
      const tree = buildClassTree(props);
      setBrowserDataProperties(tree);
      console.log("📥 Data property tree built");
    } catch (error) {
      console.error("Error loading data properties:", error);
    }
  };


  if (showBrowserPanel && browserActiveTab === "objectProperties" && browserObjectProperties.length === 0) {
    loadPropertyHierarchy();
  }

  if (showBrowserPanel && browserActiveTab === "dataProperties" && browserDataProperties.length === 0) {
    loadDataPropertyHierarchy();
  }
}, [showBrowserPanel, browserActiveTab, browserDataProperties.length]);

useEffect(() => {
}, [showBrowserPanel, browserActiveTab, browserObjectProperties.length]);

// ============================================================================
// Persist expanded items to localStorage
// ============================================================================
useEffect(() => {
  if (browserExpandedClasses.size > 0) {
    localStorage.setItem("ontotron-expanded-classes", JSON.stringify([...browserExpandedClasses]));
  }
}, [browserExpandedClasses]);

// ============================================================================
// Restore expanded items from localStorage on mount
// ============================================================================
useEffect(() => {
  const stored = localStorage.getItem("ontotron-expanded-classes");
  if (stored) {
    try {
      const expanded = JSON.parse(stored);
      setBrowserExpandedClasses(new Set(expanded));
    } catch (e) {
      console.error("Failed to restore expanded classes:", e);
    }
  }
}, []);


  // ============================================================================
  // Helper Functions
  // ============================================================================
  const showToast = useCallback((message, duration = 5000) => {
    setToast(message);
    const timer = setTimeout(() => setToast(null), duration);
    return () => clearTimeout(timer);
  }, []);

  const validateProperty = useCallback(async (propertyUri, sourceClassUri, targetClassUri) => {
    try {
      if (!propertyUri) return;
      
      const response = await fetch("/validate_property", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property: propertyUri,
          domain: sourceClassUri || "http://www.w3.org/2000/01/rdf-schema#Resource",
          range: targetClassUri || "",
        }),
      });
      
      if (!response.ok) return;
      const result = await response.json();
      
      if (result?.valid === false) {
        showToast(
          `⚠️ Domain/Range Warning:\n` +
          `Property: ${tail(propertyUri)}\n` +
          `From: ${tail(sourceClassUri)}\n` +
          `To: ${tail(targetClassUri)}`
        );
      }
    } catch (error) {
      console.error("Validation error:", error);
    }
  }, [showToast]);

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data || [];
        const hdrs = results.meta?.fields || Object.keys(rows[0] || {});
        
        setCsvData(rows);
        setHeaders(hdrs);
        setRowsShown(50);
        setMappings({});
        setNodes([]);
        setEdges([]);
        setHeaderLinks([]);
        setActiveHeader(null);
        setSelectedNode(null);
        setShowNodeOptions(false);
        setToast(null);
        
        showToast(`✅ Loaded ${rows.length} rows with ${hdrs.length} columns`);
      },
      error: (error) => {
        alert(`CSV parsing error: ${error.message}`);
      },
    });
  }, [showToast]);

  const headerToAnchorId = useCallback((header) => {
    const index = headers.indexOf(header);
    return index >= 0 ? `anchor-${index}` : null;
  }, [headers]);

// ============================================================================
// Fetch Class Details from Backend
// ============================================================================
const fetchClassDetails = useCallback(async (classUri) => {
  // Check cache first
  if (browserClassDetails[classUri]) {
    return browserClassDetails[classUri];
  }

  try {
    const response = await fetch(`/class_details?uri=${encodeURIComponent(classUri)}`);
    const data = await response.json();
    
    // Cache the result
    setBrowserClassDetails(prev => ({
      ...prev,
      [classUri]: data
    }));
    
    return data;
  } catch (error) {
    console.error("Failed to fetch class details:", error);
    return null;
  }
}, [browserClassDetails]);

// ============================================================================
// Fetch Property Details from Backend
// ============================================================================
const fetchPropertyDetails = useCallback(async (propertyUri) => {
  // Check cache first
  if (browserPropertyDetails[propertyUri]) {
    return browserPropertyDetails[propertyUri];
  }

  try {
    const response = await fetch(`/property_details?uri=${encodeURIComponent(propertyUri)}`);
    const data = await response.json();
    
    // Cache the result
    setBrowserPropertyDetails(prev => ({
      ...prev,
      [propertyUri]: data
    }));
    
    return data;
  } catch (error) {
    console.error("Failed to fetch property details:", error);
    return null;
  }
}, [browserPropertyDetails]);


  // ============================================================================
// Build Class Tree for Browser - DIAGNOSTIC VERSION
// ============================================================================
const buildClassTree = useCallback((classes) => {
  console.log("🌳 Building tree from classes:", classes.length);
  console.log("🌳 Sample class:", classes[0]);
  
  // Create a map of URI -> class
  const classMap = new Map();
  classes.forEach(cls => {
    classMap.set(cls.uri, { ...cls, children: [] });
  });

  console.log("🌳 Class map size:", classMap.size);

  // Organize into tree structure
  const roots = [];
  
  classes.forEach(cls => {
    const classNode = classMap.get(cls.uri);
    
    // If it has a parent, add to parent's children
    if (cls.parent && classMap.has(cls.parent)) {
      classMap.get(cls.parent).children.push(classNode);
    } else {
      // No parent or parent not in our set = root node
      roots.push(classNode);
    }
  });

  console.log("🌳 Root nodes found:", roots.length);
  console.log("🌳 Sample root:", roots[0]);

  // Sort by label
  const sortByLabel = (a, b) => {
    const aLabel = (a.label || tail(a.uri)).toLowerCase();
    const bLabel = (b.label || tail(b.uri)).toLowerCase();
    return aLabel.localeCompare(bLabel);
  };

  roots.sort(sortByLabel);
  roots.forEach(root => {
    const sortChildren = (node) => {
      if (node.children && node.children.length > 0) {
        node.children.sort(sortByLabel);
        node.children.forEach(sortChildren);
      }
    };
    sortChildren(root);
  });

  console.log("🌳 Final tree structure:", roots);
  return roots;
}, []);

// ============================================================================
// ONTO-TRON-5000 — Full Application Rebuild
// Part 3 of 5: Node/Edge Management and Click Handling (SAFE EDGES)
// ============================================================================

  // ============================================================================
  // Click Handler for Nodes
  // ============================================================================
  const makeOpenForId = useCallback((nodeId) => (e) => {
    e?.stopPropagation?.();
    const node = latestNodesRef.current.find((n) => n.id === nodeId);
    if (!node || String(node.id).startsWith("anchor-")) return;
    console.log("Opening options for node:", nodeId);
    setSelectedNode(node);
    setShowNodeOptions(true);
  }, []);

  // Ensure nodes have click handlers (only apply once per node)
  useEffect(() => {
    let changed = false;
    const next = nodes.map((node) => {
      if (String(node.id).startsWith("anchor-")) return node;
      if (typeof node?.data?.__open === "function") return node;
      changed = true;
      return {
        ...node,
        data: { ...(node.data || {}), __open: makeOpenForId(node.id) },
      };
    });
    if (changed) setNodes(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, makeOpenForId]);

  // Keep latest edges/nodes in refs (we already keep nodes; keep edges too)
  const latestEdgesRef = useRef(edges);
  useEffect(() => { latestEdgesRef.current = edges; }, [edges]);

  // ============================================================================
  // Edge Creation
  // ============================================================================
  const makeEdge = useCallback((source, target, property, options = {}) => {
  const labelText = String(property?.label || tail(property?.uri) || "(unnamed)");

  let sourceHandle = options.sourceHandle || "right-source";
let targetHandle = options.targetHandle || "left";

if (options.srcPos && options.tgtPos) {
  const dx = options.tgtPos.x - options.srcPos.x;
  const dy = options.tgtPos.y - options.srcPos.y;
  const isHorizontal = Math.abs(dx) >= Math.abs(dy);

  if (isHorizontal) {
    sourceHandle = dx >= 0 ? "right-source" : "left-source";
    targetHandle = dx >= 0 ? "left" : "right";
  } else {
    sourceHandle = dy >= 0 ? "bottom-source" : "top-source";
    targetHandle = dy >= 0 ? "top" : "bottom";
  }
}

  return {
    id: options.id || uid("edge"),
    source,
    target,
    type: "smoothstep",
    sourceHandle,
    targetHandle,
    label: labelText,
    animated: false,
    labelStyle: {
      fill: "#000080",
      fontWeight: 700,
      fontSize: 14,  // NUMBER not string!
      fontFamily: "Tahoma, 'Segoe UI', Geneva, Verdana, sans-serif",
    },
    labelShowBg: true,
    labelBgPadding: [8, 4],
    labelBgBorderRadius: 4,
    labelBgStyle: {
      fill: "#ffffff",
      fillOpacity: 0.95,
    },
    style: { 
      stroke: "#000080", 
      strokeWidth: 3,
    },
    markerEnd: { 
      type: MarkerType.ArrowClosed, 
      color: "#000080", 
      width: 20, 
      height: 20,
    },
    data: {
      propertyUri: property?.uri || "",
      propertyLabel: labelText,
    },
  };
}, []);

  /**
   * Safely add an edge once both endpoints exist and have positions.
   * Retries briefly to avoid NaN geometry / viewBox errors.
   */
  const safeAddEdge = useCallback(
    (sourceId, targetId, property, options = {}, attempt = 0) => {
      const src = latestNodesRef.current.find((n) => n.id === sourceId);
      const tgt = latestNodesRef.current.find((n) => n.id === targetId);

      const ready =
        src && tgt &&
        src.position && Number.isFinite(src.position.x) && Number.isFinite(src.position.y) &&
        tgt.position && Number.isFinite(tgt.position.x) && Number.isFinite(tgt.position.y);

      if (!ready) {
        if (attempt < 20) {
          // Try again shortly; this lets ReactFlow commit nodes/layout first.
          setTimeout(() => safeAddEdge(sourceId, targetId, property, options, attempt + 1), 25);
        } else {
          console.warn("⚠️ Gave up adding edge after retries:", { sourceId, targetId });
          showToast("⚠️ Couldn’t attach edge yet — try again.");
        }
        return;
      }

      const edge = makeEdge(sourceId, targetId, property, {
        srcPos: src.position,
        tgtPos: tgt.position,
        ...options,
      });
      setEdges((eds) => [...eds, edge]);
      console.log("🔗 Edge added:", edge);
    },
    [makeEdge, showToast]
  );

  // ============================================================================
  // ReactFlow Handlers
  // ============================================================================
  const onNodesChange = useCallback((changes) => {
    setNodes((prev) => applyNodeChanges(changes, prev));
  }, []);

  const onEdgesChange = useCallback((changes) => {
    const filtered = changes.filter((c) => c.type !== "select" || c.selected === true);
    setEdges((eds) => applyEdgeChanges(filtered, eds));
  }, []);

  const onConnect = useCallback(
    (params) => {
      const srcNode = latestNodesRef.current.find((n) => n.id === params.source);
      if (!srcNode || !params.target) return;

      setSelectedNode(srcNode);
      setSelectedTargetNodeId(params.target);
      setPropertyModalMode("connectExisting");
      setChosenProperty(null);
      setPropertySearchTerm("");
      setShowPropertyModal(true);
    },
    []
  );

  const handleNodeClick = useCallback((event, node) => {
  event?.stopPropagation?.();
  event?.preventDefault?.();
if (String(node.id).startsWith("anchor-")) return;

setNodes((prev) => {
  
 return prev.map(n => ({
    ...n,
    selected: n.id === node.id
  }));
});

setSelectedNode(node);
setShowNodeOptions(true);
}, []);

  const handleEdgeContextMenu = useCallback((event, edge) => {
    event.preventDefault();
    event.stopPropagation();
    setEdgeBeingEdited({ kind: "rf", edge });
    setEdgeContext({ type: "rf", id: edge.id, x: event.clientX, y: event.clientY });
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setEdgeContext(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // ============================================================================
  // Node Creation Functions
  // ============================================================================
  const addLinkedNode = useCallback(
    (sourceNodeId, classUri, classLabel, property) => {
      try {
        const sourceNode = latestNodesRef.current.find((n) => n.id === sourceNodeId);
        const nodeId = uid("node");

        const position = sourceNode
          ? { x: sourceNode.position.x + 280, y: sourceNode.position.y }
          : { x: 100, y: 100 };

        const newNode = {
          id: nodeId,
          type: "clickable",
          position,
          data: {
            label: classLabel || tail(classUri),
            uri: classUri,
            isCustom: String(classUri || "").includes("/custom/"),
            __open: makeOpenForId(nodeId),
          },
          selectable: true,  // ADD THIS LINE
          style: { width: 200, height: 60 },
        };

        setNodes((prev) => [...prev, newNode]);

        const prop = property?.uri ? property : RDF_TYPE;
        // For rdf:type (Instance Of), reverse direction: new node -> clicked node
        // For other properties, keep as: clicked node -> new node
        const isInstanceOf = prop.uri === RDF_TYPE.uri;
        if (isInstanceOf) {
          safeAddEdge(nodeId, sourceNodeId, prop);  // Josh is instance of Person
        } else {
          safeAddEdge(sourceNodeId, nodeId, prop);  // Person has_part Josh
        }

        const sourceUri = sourceNode?.data?.uri || "";
        validateProperty(prop.uri, sourceUri, classUri);
      } catch (err) {
        console.error("addLinkedNode error:", err);
        showToast("❌ Couldn’t add linked node");
      }
    },
    [makeOpenForId, safeAddEdge, validateProperty, showToast]
  );

  const addPropertyEdgeBetweenExisting = useCallback(
    (sourceId, targetId, property) => {
      try {
        const prop = property?.uri ? property : RDF_TYPE;
        safeAddEdge(sourceId, targetId, prop);
        const sourceUri = latestNodesRef.current.find((n) => n.id === sourceId)?.data?.uri || "";
        const targetUri = latestNodesRef.current.find((n) => n.id === targetId)?.data?.uri || "";
        validateProperty(prop.uri, sourceUri, targetUri);
      } catch (err) {
        console.error("addPropertyEdgeBetweenExisting error:", err);
        showToast("❌ Couldn’t connect nodes");
      }
    },
    [safeAddEdge, validateProperty, showToast]
  );

  // ============================================================================
  // Export Functions
  // ============================================================================
  const generateRDF = useCallback(async () => {
    try {
      const exportNodes = latestNodesRef.current
        .filter((n) => !String(n.id).startsWith("anchor-"))
        .map((n) => ({
          id: n.id,
          label: n.data?.label,
          uri: n.data?.uri,
          position: n.position,
        }));

      const exportEdges = latestEdgesRef.current.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        propertyUri: e.data?.propertyUri || "",
        propertyLabel: e.data?.propertyLabel || e.label || "",
      }));

      const exportHeaderLinks = headerLinks.map((hl) => ({
        id: hl.id,
        header: hl.header,
        nodeId: hl.nodeId,
        propertyUri: hl.property?.uri || "",
        propertyLabel: hl.property?.label || "",
      }));

      const response = await fetch("/generate_rdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mappings,
          nodes: exportNodes,
          edges: exportEdges,
          headerLinks: exportHeaderLinks,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "ontology.ttl";
      link.click();
      URL.revokeObjectURL(url);

      showToast("✅ RDF file generated successfully");
    } catch (error) {
      alert(`❌ RDF generation failed: ${error.message}`);
    }
  }, [headerLinks, mappings, showToast]);

  const generateR2RML = useCallback(async () => {
    try {
      const exportNodes = latestNodesRef.current
        .filter((n) => !String(n.id).startsWith("anchor-"))
        .map((n) => ({
          id: n.id,
          label: n.data?.label,
          uri: n.data?.uri,
          position: n.position,
        }));

      const exportEdges = latestEdgesRef.current.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        propertyUri: e.data?.propertyUri || "",
        propertyLabel: e.data?.propertyLabel || e.label || "",
      }));

      const exportHeaderLinks = headerLinks.map((hl) => ({
        id: hl.id,
        header: hl.header,
        nodeId: hl.nodeId,
        propertyUri: hl.property?.uri || "",
        propertyLabel: hl.property?.label || "",
      }));

      const response = await fetch("/generate_r2rml", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mappings,
          nodes: exportNodes,
          edges: exportEdges,
          headerLinks: exportHeaderLinks,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "mappings.ttl";
      link.click();
      URL.revokeObjectURL(url);

      showToast("✅ R2RML mappings generated successfully");
    } catch (error) {
      alert(`❌ R2RML generation failed: ${error.message}`);
    }
  }, [headerLinks, mappings, showToast]);

  const generateMermaid = useCallback(async () => {
  try {
    const payload = {
      nodes,
      edges,
      headerLinks,
    };

    const resp = await fetch("/generate_mermaid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      alert("Failed to generate Mermaid syntax");
      return;
    }

    const data = await resp.json();
    setMermaidSyntax(data.mermaid);
    setShowMermaidModal(true);
  } catch (err) {
    console.error("Error generating Mermaid:", err);
    alert("Error generating Mermaid syntax");
  }
}, [nodes, edges, headerLinks]);
  // ============================================================================
// ONTO-TRON-5000 — Full Application Rebuild  
// Part 4 of 5: All Modal Components (UPDATED)
// ============================================================================

  // ============================================================================
// Header Class Picker Modal - FIXED VERSION
// ============================================================================
const HeaderClassPicker = useCallback(() => {
  if (!activeHeader) return null;

  const handleClassSelect = (result) => {
    console.log("Class selected:", result.label);
    
    setPendingHeader({
      header: activeHeader,
      cls: { uri: result.uri, label: result.label },
      anchorId: headerToAnchorId(activeHeader),
    });
    
    setMappings(prev => ({ ...prev, [activeHeader]: result.uri }));
    setActiveHeader(null);
    setPropertyModalMode("anchorToNewNode");
    setChosenProperty(RDF_TYPE);
    setPropertySearchTerm("");
    
    setTimeout(() => {
      setShowHeaderPropertyModal(true);
    }, 100);
  };

  return (
    <>
      <div
        className="ontotron-backdrop"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 9998,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setActiveHeader(null);
        }}
      />
      <div 
        style={retroTheme.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={retroTheme.modalHeader}>
          <span>Select Class for "{activeHeader}"</span>
          <button
            style={{
              background: "#c0c0c0",
              border: "1px solid",
              borderColor: "#ffffff #000000 #000000 #ffffff",
              padding: "0 6px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
            onClick={(e) => {
              e.stopPropagation();
              setActiveHeader(null);
            }}
          >
            ✕
          </button>
        </div>
        <div style={retroTheme.modalContent}>
          <input
            style={retroTheme.input}
            placeholder="Search BFO/CCO classes..."
            value={headerSearchTerm}
            onChange={(e) => setHeaderSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
          <div style={{
            maxHeight: "280px",
            overflowY: "auto",
            border: "2px solid",
            borderColor: "#000000 #ffffff #ffffff #000000",
            background: "#ffffff",
            marginBottom: "8px",
          }}>
            {headerIsSearching && (
              <div style={{ padding: "8px", textAlign: "center" }}>Searching...</div>
            )}
            {!headerIsSearching && headerSearchResults.map((result) => (
              <div
                key={result.uri}
                style={retroTheme.listItem}
                title={result.uri}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#316ac5";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "inherit";
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClassSelect(result);
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <strong>{result.label}</strong>
                <div style={{ fontSize: "10px", opacity: 0.8 }}>{result.uri}</div>
              </div>
            ))}
          </div>
          <button
            style={{ ...retroTheme.button, width: "100%" }}
            onClick={(e) => {
              e.stopPropagation();
              setActiveHeader(null);
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}, [activeHeader, headerSearchTerm, headerSearchResults, headerIsSearching, headerToAnchorId]);
  // ============================================================================
// Node Class Selection Modal - FIXED VERSION
// ============================================================================
const NodeClassModal = useCallback(() => {
  if (!showNodeClassModal) return null;

  const handleClassSelect = (result) => {
    console.log("Node class selected:", result.label);
    
    setPendingNodeClass({ uri: result.uri, label: result.label });
    setShowNodeClassModal(false);
    setPropertyModalMode("newFromNode");
    setChosenProperty(null);
    setPropertySearchTerm("");
    
    setTimeout(() => {
      setShowPropertyModal(true);
    }, 100);
  };

  return (
    <>
      <div
        className="ontotron-backdrop"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 9998,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setShowNodeClassModal(false);
        }}
      />
      <div 
        style={retroTheme.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={retroTheme.modalHeader}>
          <span>Select Class (BFO/CCO)</span>
          <button
            style={{
              background: "#c0c0c0",
              border: "1px solid",
              borderColor: "#ffffff #000000 #000000 #ffffff",
              padding: "0 6px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
            onClick={(e) => {
              e.stopPropagation();
              setShowNodeClassModal(false);
            }}
          >
            ✕
          </button>
        </div>
        <div style={retroTheme.modalContent}>
          <input
            style={retroTheme.input}
            placeholder="Search BFO/CCO classes..."
            value={nodeClassSearchTerm}
            onChange={(e) => setNodeClassSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
          <div style={{
            maxHeight: "280px",
            overflowY: "auto",
            border: "2px solid",
            borderColor: "#000000 #ffffff #ffffff #000000",
            background: "#ffffff",
            marginBottom: "8px",
          }}>
            {nodeClassIsSearching && (
              <div style={{ padding: "8px", textAlign: "center" }}>Searching...</div>
            )}
            {!nodeClassIsSearching && nodeClassResults.map((result) => (
              <div
                key={result.uri}
                style={retroTheme.listItem}
                title={result.uri}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#316ac5";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "inherit";
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClassSelect(result);
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <strong>{result.label}</strong>
                <div style={{ fontSize: "10px", opacity: 0.8 }}>{result.uri}</div>
              </div>
            ))}
          </div>
          <button
            style={{ ...retroTheme.button, width: "100%" }}
            onClick={(e) => {
              e.stopPropagation();
              setShowNodeClassModal(false);
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}, [showNodeClassModal, nodeClassSearchTerm, nodeClassResults, nodeClassIsSearching]);
  // ============================================================================
  // Custom Class Modal
  // ============================================================================
  const CustomClassModal = useCallback(() => {
  if (!showCustomModal) return null;

  return (
    <>
      <div
        className="ontotron-backdrop"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 9998,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setShowCustomModal(false);
        }}
      />
      <div 
        style={retroTheme.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={retroTheme.modalHeader}>
          <span>Create Custom Class</span>
          <button
            style={{
              background: "#c0c0c0",
              border: "1px solid",
              borderColor: "#ffffff #000000 #000000 #ffffff",
              padding: "0 6px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
            onClick={(e) => {
              e.stopPropagation();
              setShowCustomModal(false);
            }}
          >
            ✕
          </button>
        </div>
        <div style={retroTheme.modalContent}>
          <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
            Class Label (required):
          </label>
          <input
            style={retroTheme.input}
            placeholder="e.g., Manufacturing Process"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
          
          <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
            Definition (optional):
          </label>
          <textarea
            style={{ ...retroTheme.input, height: "80px", resize: "vertical" }}
            placeholder="A process that transforms raw materials..."
            value={customDef}
            onChange={(e) => setCustomDef(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          
          <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
            Parent Class (optional):
          </label>
          <input
            style={retroTheme.input}
            placeholder="Search for parent class..."
            value={customParentSearch}
            onChange={(e) => setCustomParentSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          
          <div style={{
            maxHeight: "120px",
            overflowY: "auto",
            border: "2px solid",
            borderColor: "#000000 #ffffff #ffffff #000000",
            background: "#ffffff",
            marginBottom: "8px",
          }}>
            {customParentIsSearching && (
              <div style={{ padding: "8px", textAlign: "center" }}>Searching...</div>
            )}
            {!customParentIsSearching && customParentResults.map((result) => (
              <div
                key={result.uri}
                style={{
                  ...retroTheme.listItem,
                  background: customParentPicked?.uri === result.uri ? "#316ac5" : "transparent",
                  color: customParentPicked?.uri === result.uri ? "#ffffff" : "inherit",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setCustomParentPicked({ uri: result.uri, label: result.label });
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <strong>{result.label}</strong>
                <div style={{ fontSize: "10px", opacity: 0.8 }}>{result.uri}</div>
              </div>
            ))}
            {!customParentIsSearching && customParentResults.length === 0 && (
              <div style={{ padding: "8px", textAlign: "center", opacity: 0.7 }}>
                No results. Try another term.
              </div>
            )}
          </div>
          
          {customParentPicked && (
            <div style={{
              padding: "4px 8px",
              background: "#e0f0ff",
              border: "1px solid #0066cc",
              marginBottom: "8px",
              fontSize: "11px",
            }}>
              Selected parent: <strong>{customParentPicked.label}</strong>
            </div>
          )}
          
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              style={{ ...retroTheme.button, flex: 1 }}
              onClick={(e) => {
                e.stopPropagation();
                if (!customLabel.trim()) {
                  alert("Please provide a label for the custom class");
                  return;
                }
                const safeName = customLabel.trim().toLowerCase()
                  .replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
                const customUri = `http://example.org/custom/${safeName}`;
                
                setPendingNodeClass({
                  uri: customUri,
                  label: customLabel.trim(),
                  parent: customParentPicked,
                  definition: customDef,
                  isCustom: true,
                });
                
                setShowCustomModal(false);
                setPropertyModalMode("newFromNode");
                setChosenProperty(null);
                setPropertySearchTerm("");
                setTimeout(() => setShowPropertyModal(true), 0);
              }}
            >
              Create → Select Property
            </button>
            <button
              style={{ ...retroTheme.button, flex: 1 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowCustomModal(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}, [
  showCustomModal,
  customLabel,
  customDef,
  customParentSearch, 
  customParentResults,
  customParentIsSearching,
  customParentPicked,
  setPendingNodeClass,
  setShowCustomModal,
  setPropertyModalMode,
  setChosenProperty,
  setPropertySearchTerm,
  setShowPropertyModal
]);


// ============================================================================
// Ontology Browser Panel - PROTÉGÉ STYLE
// ============================================================================
const OntologyBrowserPanel = useCallback(() => {
  if (!showBrowserPanel) return null;

  const handleClassClick = async (classItem) => {
    setBrowserSelectedClass(classItem);
    await fetchClassDetails(classItem.uri);
  };

  const handlePropertyClick = async (propertyItem) => {
    console.log("🔍 Property clicked:", propertyItem);
    setBrowserSelectedProperty(propertyItem);
    const details = await fetchPropertyDetails(propertyItem.uri);
    console.log("📋 Property details received:", details);
  };

  const toggleExpanded = (uri) => {
    setBrowserExpandedClasses(prev => {
      const next = new Set(prev);
      if (next.has(uri)) {
        next.delete(uri);
      } else {
        next.add(uri);
      }
      return next;
    });
  };

  const handleAddToCanvas = () => {
    if (!browserSelectedClass) return;
    
    const existingNodes = nodes.filter(n => !n.id.startsWith("anchor-"));
    if (existingNodes.length === 0) {
      alert("Please create at least one node first by setting a semantic type on a column header.");
      return;
    }

    setPendingNodeClass({
      uri: browserSelectedClass.uri,
      label: browserSelectedClass.label,
    });
    
    setShowBrowserPanel(false);
    setShowExistingNodeModal(true);
  };

  // Recursive tree renderer for both classes and properties
  const renderClassTree = (classNodes, depth = 0) => {
    return classNodes.map(classNode => {
      const isExpanded = browserExpandedClasses.has(classNode.uri);
      const hasChildren = classNode.children && classNode.children.length > 0;
      const isSelected = browserSelectedClass?.uri === classNode.uri || browserSelectedProperty?.uri === classNode.uri;

      return (
        <div key={classNode.uri}>
          <div
            style={{
              ...retroTheme.listItem,
              paddingLeft: `${8 + depth * 20}px`,
              background: isSelected ? "#316ac5" : "transparent",
              color: isSelected ? "#ffffff" : "inherit",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              borderBottom: "1px solid #e0e0e0",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.background = "#f0f0f0";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.background = "transparent";
              }
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              if (browserActiveTab === "classes") {
                handleClassClick(classNode);
              } else if (browserActiveTab === "objectProperties" || browserActiveTab === "dataProperties") {
                handlePropertyClick(classNode);
              }
            }}
          >
            {hasChildren ? (
              <span
                style={{
                  width: "16px",
                  height: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  userSelect: "none",
                  fontSize: "10px",
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  toggleExpanded(classNode.uri);
                }}
              >
                {isExpanded ? "▼" : "▶"}
              </span>
            ) : (
              <span style={{ width: "16px" }}></span>
            )}
            <span style={{ 
              fontSize: "11px",
              fontWeight: hasChildren ? "600" : "400",
            }}>
              {classNode.label || tail(classNode.uri)}
            </span>
          </div>
          {hasChildren && isExpanded && (
            <div>{renderClassTree(classNode.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  const handleResize = useCallback((e) => {
    if (!browserIsResizing) return;
    
    const newWidth = ((window.innerWidth - e.clientX) / window.innerWidth) * 100;
    const clampedWidth = Math.min(33, Math.max(25, newWidth));
    setBrowserPanelWidth(clampedWidth);
  }, [browserIsResizing]);

  const handleResizeEnd = useCallback(() => {
    setBrowserIsResizing(false);
  }, []);

  useEffect(() => {
    if (browserIsResizing) {
      window.addEventListener("mousemove", handleResize);
      window.addEventListener("mouseup", handleResizeEnd);
      return () => {
        window.removeEventListener("mousemove", handleResize);
        window.removeEventListener("mouseup", handleResizeEnd);
      };
    }
  }, [browserIsResizing, handleResize, handleResizeEnd]);

  // Get cached details
  const classDetails = browserSelectedClass ? browserClassDetails[browserSelectedClass.uri] : null;
  const propertyDetails = browserSelectedProperty ? browserPropertyDetails[browserSelectedProperty.uri] : null;



  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: `${browserPanelWidth}vw`,
        height: "100vh",
        background: "#c0c0c0",
        border: "2px solid",
        borderColor: "#ffffff #000000 #000000 #ffffff",
        boxShadow: "-2px 0 8px rgba(0,0,0,0.3)",
        zIndex: 500,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Resize Handle */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "4px",
          cursor: "ew-resize",
          background: browserIsResizing ? "#0066cc" : "transparent",
        }}
        onMouseDown={() => setBrowserIsResizing(true)}
      />

      {/* Header */}
      <div style={{
        ...retroTheme.modalHeader,
        borderRadius: 0,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span>🔍 Ontology Browser</span>
        <button
          style={{
            background: "#c0c0c0",
            border: "1px solid",
            borderColor: "#ffffff #000000 #000000 #ffffff",
            padding: "0 6px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setShowBrowserPanel(false);
          }}
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        borderBottom: "2px solid #808080",
        background: "#c0c0c0",
      }}>
        {["classes", "objectProperties", "dataProperties"].map(tab => (
          <button
            key={tab}
            style={{
              ...retroTheme.button,
              flex: 1,
              margin: "2px 2px 0 2px",
              background: browserActiveTab === tab
                ? "linear-gradient(180deg, #ffffff 0%, #e5e5e5 100%)"
                : "linear-gradient(180deg, #d4d4d4 0%, #c0c0c0 100%)",
              borderBottom: browserActiveTab === tab ? "none" : "2px solid #808080",
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setBrowserActiveTab(tab);
              setBrowserSelectedClass(null);
              setBrowserSelectedProperty(null);
            }}
          >
            {tab === "classes" && "Classes"}
            {tab === "objectProperties" && "Object Properties"}
            {tab === "dataProperties" && "Data Properties"}
          </button>
        ))}
      </div>

      {/* Content Area - SPLIT VIEW */}
      <div style={{
        flex: 1,
        display: "flex",
        overflow: "hidden",
      }}>
        {/* LEFT: Tree/List View - SCROLLABLE */}
        <div style={{
          flex: browserSelectedClass || browserSelectedProperty ? 1 : 2,
          overflowY: "auto",
          overflowX: "hidden",
          background: "#ffffff",
          border: "2px solid",
          borderColor: "#808080 #ffffff #ffffff #808080",
          margin: "4px",
        }}>
          {/* CLASSES TAB */}
          {browserActiveTab === "classes" && (
            <>
              {browserClassHierarchy.length === 0 && (
                <div style={{ padding: "20px", textAlign: "center", color: "#666666", fontSize: "11px" }}>
                  Loading class hierarchy...
                </div>
              )}
              {renderClassTree(browserClassHierarchy)}
            </>
          )}

         {/* OBJECT PROPERTIES TAB */}
{browserActiveTab === "objectProperties" && (
  <>
    {browserObjectProperties.length === 0 && (
      <div style={{ padding: "20px", textAlign: "center", color: "#666666", fontSize: "11px" }}>
        Loading properties...
      </div>
    )}
    {renderClassTree(browserObjectProperties)}
  </>
)}

          {/* DATA PROPERTIES TAB */}
          {browserActiveTab === "dataProperties" && (
            <>
              {browserDataProperties.length === 0 && (
                <div style={{ padding: "20px", textAlign: "center", color: "#666666", fontSize: "11px" }}>
                  Loading data properties...
                </div>
              )}
              {renderClassTree(browserDataProperties)}
            </>
          )}
        </div>

        {/* RIGHT: Details Panel - SCROLLABLE */}
        {(browserSelectedClass || browserSelectedProperty) && (
          <div style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            background: "#ffffff",
            border: "2px solid",
            borderColor: "#808080 #ffffff #ffffff #808080",
            margin: "4px 4px 4px 0",
            padding: "8px",
          }}>
            {/* CLASS DETAILS */}
            {browserSelectedClass && browserActiveTab === "classes" && (
              <>
                <div style={{ 
                  fontSize: "13px", 
                  fontWeight: "bold", 
                  marginBottom: "12px",
                  paddingBottom: "8px",
                  borderBottom: "2px solid #e0e0e0",
                }}>
                  {browserSelectedClass.label || tail(browserSelectedClass.uri)}
                </div>
                
                {/* URI */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "10px", fontWeight: "bold", color: "#666666", marginBottom: "4px" }}>
                    IRI:
                  </div>
                  <div style={{ 
                    fontSize: "9px", 
                    color: "#0066cc", 
                    wordBreak: "break-all",
                    background: "#f5f5f5",
                    padding: "4px",
                    border: "1px solid #e0e0e0",
                    fontFamily: "monospace",
                  }}>
                    {browserSelectedClass.uri}
                  </div>
                </div>

                {/* Definition */}
                {classDetails?.definition && (
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "10px", fontWeight: "bold", color: "#666666", marginBottom: "4px" }}>
                      Definition:
                    </div>
                    <div style={{ 
                      fontSize: "10px", 
                      lineHeight: "1.5",
                      background: "#f5f5f5",
                      padding: "6px",
                      border: "1px solid #e0e0e0",
                    }}>
                      {classDetails.definition}
                    </div>
                  </div>
                )}

                {/* Parents / Superclasses */}
                {classDetails?.parents && classDetails.parents.length > 0 && (
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "10px", fontWeight: "bold", color: "#666666", marginBottom: "4px" }}>
                      Superclasses:
                    </div>
                    <div style={{ 
                      background: "#f5f5f5",
                      padding: "6px",
                      border: "1px solid #e0e0e0",
                    }}>
                      {classDetails.parents.map((parent, idx) => (
                        <div key={idx} style={{ fontSize: "10px", marginBottom: "2px" }}>
                          • {parent.label || tail(parent.uri)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Equivalent Classes */}
                {classDetails?.equivalentClasses && classDetails.equivalentClasses.length > 0 && (
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "10px", fontWeight: "bold", color: "#666666", marginBottom: "4px" }}>
                      Equivalent To:
                    </div>
                    <div style={{ 
                      background: "#fff8e0",
                      padding: "6px",
                      border: "1px solid #ffcc00",
                    }}>
                      {classDetails.equivalentClasses.map((equiv, idx) => (
                        <div key={idx} style={{ fontSize: "10px", marginBottom: "2px" }}>
                          • {equiv.label || tail(equiv.uri)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disjoint With */}
                {classDetails?.disjointWith && classDetails.disjointWith.length > 0 && (
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "10px", fontWeight: "bold", color: "#666666", marginBottom: "4px" }}>
                      Disjoint With:
                    </div>
                    <div style={{ 
                      background: "#ffe0e0",
                      padding: "6px",
                      border: "1px solid #ff6666",
                    }}>
                      {classDetails.disjointWith.map((disj, idx) => (
                        <div key={idx} style={{ fontSize: "10px", marginBottom: "2px" }}>
                          • {disj.label || tail(disj.uri)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add to Canvas Button */}
                <button
                  style={{ ...retroTheme.button, width: "100%", marginTop: "8px" }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleAddToCanvas();
                  }}
                >
                  ➕ Add to Canvas
                </button>
              </>
            )}

            {/* PROPERTY DETAILS */}
            {browserSelectedProperty && (browserActiveTab === "objectProperties" || browserActiveTab === "dataProperties") && (
              <>
                <div style={{ 
                  fontSize: "13px", 
                  fontWeight: "bold", 
                  marginBottom: "12px",
                  paddingBottom: "8px",
                  borderBottom: "2px solid #e0e0e0",
                }}>
                  {browserSelectedProperty.label || tail(browserSelectedProperty.uri)}
                </div>
                
                {/* URI */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "10px", fontWeight: "bold", color: "#666666", marginBottom: "4px" }}>
                    IRI:
                  </div>
                  <div style={{ 
                    fontSize: "9px", 
                    color: "#0066cc", 
                    wordBreak: "break-all",
                    background: "#f5f5f5",
                    padding: "4px",
                    border: "1px solid #e0e0e0",
                    fontFamily: "monospace",
                  }}>
                    {browserSelectedProperty.uri}
                  </div>
                </div>

                {/* Definition */}
                {propertyDetails?.definition && (
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "10px", fontWeight: "bold", color: "#666666", marginBottom: "4px" }}>
                      Definition:
                    </div>
                    <div style={{ 
                      fontSize: "10px", 
                      lineHeight: "1.5",
                      background: "#f5f5f5",
                      padding: "6px",
                      border: "1px solid #e0e0e0",
                    }}>
                      {propertyDetails.definition}
                    </div>
                  </div>
                )}

                {/* Domain */}
                {propertyDetails?.domain && propertyDetails.domain.length > 0 && (
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "10px", fontWeight: "bold", color: "#666666", marginBottom: "4px" }}>
                      Domain:
                    </div>
                    <div style={{ 
                      background: "#e0f0ff",
                      padding: "6px",
                      border: "1px solid #0066cc",
                    }}>
                      {propertyDetails.domain.map((dom, idx) => (
                        <div key={idx} style={{ fontSize: "10px", marginBottom: "2px" }}>
                          • {dom.label || tail(dom.uri)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Range */}
                {propertyDetails?.range && propertyDetails.range.length > 0 && (
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "10px", fontWeight: "bold", color: "#666666", marginBottom: "4px" }}>
                      Range:
                    </div>
                    <div style={{ 
                      background: "#e0ffe0",
                      padding: "6px",
                      border: "1px solid #00cc00",
                    }}>
                      {propertyDetails.range.map((rng, idx) => (
                        <div key={idx} style={{ fontSize: "10px", marginBottom: "2px" }}>
                          • {rng.label || tail(rng.uri)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inverse */}
                {propertyDetails?.inverse && propertyDetails.inverse.length > 0 && (
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "10px", fontWeight: "bold", color: "#666666", marginBottom: "4px" }}>
                      Inverse Of:
                    </div>
                    <div style={{ 
                      background: "#fff0e0",
                      padding: "6px",
                      border: "1px solid #ff9900",
                    }}>
                      {propertyDetails.inverse.map((inv, idx) => (
                        <div key={idx} style={{ fontSize: "10px", marginBottom: "2px" }}>
                          • {inv.label || tail(inv.uri)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}, [
  showBrowserPanel,
  browserPanelWidth,
  browserActiveTab,
  browserExpandedClasses,
  browserClassHierarchy,
  browserObjectProperties,
  browserSelectedClass,
  browserSelectedProperty,
  browserClassDetails,
  browserPropertyDetails,
  browserIsResizing,
  nodes,
  fetchClassDetails,
  fetchPropertyDetails,
  setBrowserExpandedClasses,
  setPendingNodeClass,
  setShowExistingNodeModal,
]);

  // ============================================================================
  // Property Selection Modal
  // ============================================================================
  const PropertyModal = useCallback(({ isHeader }) => {
  const isOpen = isHeader ? showHeaderPropertyModal : showPropertyModal;
  if (!isOpen) return null;

  const close = () => {
    if (isHeader) setShowHeaderPropertyModal(false);
    else setShowPropertyModal(false);
    setChosenProperty(null);
    setPropertySearchTerm("");
    setSelectedTargetNodeId("");
    setEdgeBeingEdited(null);
    setPropertyModalTab("dataProperties"); // Reset to data properties tab
  };

  const onConfirm = () => {
  try {
    const prop = chosenProperty || RDF_TYPE;

    if (propertyModalMode === "editEdge" && edgeBeingEdited?.kind === "rf") {
      const edge = edgeBeingEdited.edge;
      setEdges(eds => eds.map(e =>
        e.id === edge.id
          ? {
              ...e,
              label: String(prop.label || tail(prop.uri)),
              data: {
                ...(e.data || {}),
                propertyUri: prop.uri,
                propertyLabel: prop.label || tail(prop.uri),
              },
            }
          : e
      ));
      const sourceUri = nodes.find(n => n.id === edge.source)?.data?.uri || "";
      const targetUri = nodes.find(n => n.id === edge.target)?.data?.uri || "";
      validateProperty(prop.uri, sourceUri, targetUri);
      setEdgeBeingEdited(null);
      close();
      return;
    }

    if (propertyModalMode === "connectExisting" && !isHeader) {
      console.log("🔗 Connecting existing nodes:", {
        source: selectedNode?.id,
        target: selectedTargetNodeId,
        property: prop.label
      });
      
      if (!selectedNode?.id) {
        alert("Missing source node");
        return;
      }
      
      if (!selectedTargetNodeId) {
        alert("Please select a target node");
        return;
      }
      
      // Create the edge
      addPropertyEdgeBetweenExisting(selectedNode.id, selectedTargetNodeId, prop);
      setSelectedTargetNodeId("");
      close();
      return;
    }

    if (propertyModalMode === "newFromNode") {
      if (!selectedNode?.id || !pendingNodeClass?.uri) {
        alert("Missing source node or class");
        return;
      }
      addLinkedNode(
        selectedNode.id,
        pendingNodeClass.uri,
        pendingNodeClass.label,
        prop
      );
      setPendingNodeClass(null);
      close();
      return;
    }

    if (propertyModalMode === "anchorToNewNode" && isHeader) {
      if (!pendingHeader?.header || !pendingHeader?.cls?.uri) {
        alert("Missing header or class");
        return;
      }

      const nodeId = canvasApiRef.current?.addNodeForHeader(
        pendingHeader.header,
        pendingHeader.cls.uri,
        pendingHeader.cls.label
      );

      if (nodeId) {
        const anchorId = pendingHeader.anchorId;
        if (anchorId) {
          // For data properties, flip the direction: node -> anchor (data value)
          // For object properties, keep as: anchor -> node
          const isDataProperty = propertyModalTab === "dataProperties";
          const rfEdge = isDataProperty 
            ? makeEdge(nodeId, anchorId, prop, { sourceHandle: "bottom-source", targetHandle: "top" })  // Node bottom to anchor top
            : makeEdge(anchorId, nodeId, prop); // Anchor to node
          setTimeout(() => setEdges(eds => [...eds, rfEdge]), 50);
        }

        const link = {
          id: uid("hlink"),
          header: pendingHeader.header,
          nodeId,
          property: prop,
        };
        setHeaderLinks(ls => [...ls, link]);

        validateProperty(
          prop.uri,
          "http://www.w3.org/2000/01/rdf-schema#Resource",
          pendingHeader.cls.uri
        );
      }
      setPendingHeader(null);
      close();
      return;
    }
  } catch (err) {
    console.error(err);
    showToast("❌ Error applying property. See console.");
  }
};

  return (
    <>
      <div
        className="ontotron-backdrop"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 9998,
        }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            close();
          }
        }}
      />
      <div 
        style={retroTheme.modal}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={retroTheme.modalHeader}>
          <span>Select Object Property</span>
          <button
            style={{
              background: "#c0c0c0",
              border: "1px solid",
              borderColor: "#ffffff #000000 #000000 #ffffff",
              padding: "0 6px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              close();
            }}
          >
            ✕
          </button>
        </div>
        <div style={retroTheme.modalContent}>
          {/* Property Type Tabs */}
          <div style={{
            display: "flex",
            gap: "4px",
            marginBottom: "8px",
            borderBottom: "2px solid #808080",
          }}>
            {["dataProperties", "objectProperties"].map(tab => (
              <button
                key={tab}
                style={{
                  ...retroTheme.button,
                  flex: 1,
                  padding: "6px 12px",
                  fontSize: "11px",
                  background: propertyModalTab === tab ? "#316ac5" : "#c0c0c0",
                  color: propertyModalTab === tab ? "#ffffff" : "#000000",
                  fontWeight: propertyModalTab === tab ? "bold" : "normal",
                  borderBottom: propertyModalTab === tab ? "none" : "2px solid #808080",
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setPropertyModalTab(tab);
                }}
              >
                {tab === "dataProperties" ? "Data Properties" : "Object Properties"}
              </button>
            ))}
          </div>
          
          <input
            style={retroTheme.input}
            placeholder="Search properties..."
            value={propertySearchTerm}
            onChange={(e) => setPropertySearchTerm(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") onConfirm();
            }}
          />

          {typeof propFilterInfo?.shown === "number" && typeof propFilterInfo?.total === "number" && (
            <div style={{ fontSize: "10px", opacity: 0.65, margin: "4px 0 6px" }}>
              Showing {propFilterInfo.shown} of {propFilterInfo.total} matches
            </div>
          )}
          
          <div style={{
            maxHeight: "240px",
            overflowY: "auto",
            border: "2px solid",
            borderColor: "#000000 #ffffff #ffffff #000000",
            background: "#ffffff",
            marginBottom: "8px",
          }}>
            {filteredProperties.map((prop) => (
              <div
                key={prop.uri}
                style={{
                  ...retroTheme.listItem,
                  background: chosenProperty?.uri === prop.uri ? "#316ac5" : "transparent",
                  color: chosenProperty?.uri === prop.uri ? "#ffffff" : "inherit",
                }}
                title={prop.uri}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setChosenProperty(prop);
                }}
              >
                <strong>{prop.label}</strong>
                <div style={{ fontSize: "10px", opacity: 0.8 }}>{prop.uri}</div>
              </div>
            ))}
            {filteredProperties.length === 0 && (
              <div style={{ padding: "8px", textAlign: "center", opacity: 0.7 }}>
                No properties found. Try a different search.
              </div>
            )}
          </div>
          
          {propertyModalMode === "connectExisting" && !isHeader && !selectedTargetNodeId && (
  <>
    <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
      Target Node:
    </label>
    <select
      style={retroTheme.input}
      value={selectedTargetNodeId}
      onChange={(e) => setSelectedTargetNodeId(e.target.value)}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <option value="">— Select target node —</option>
      {nodes
        .filter(n => n.id !== selectedNode?.id && !n.id.startsWith("anchor-"))
        .map(n => (
          <option key={n.id} value={n.id}>
            {n.data?.label || n.id}
          </option>
        ))}
    </select>
  </>
)}

{propertyModalMode === "connectExisting" && !isHeader && selectedTargetNodeId && (
  <div style={{
    padding: "6px",
    background: "#e0f0ff",
    border: "1px solid #0066cc",
    fontSize: "11px",
    borderRadius: "3px",
    marginBottom: "8px",
  }}>
    Linking to: <strong>{nodes.find(n => n.id === selectedTargetNodeId)?.data?.label || "Selected Node"}</strong>
  </div>
)}
          
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              style={{ ...retroTheme.button, flex: 1 }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onConfirm();
              }}
            >
              Confirm
            </button>
            <button
              style={{ ...retroTheme.button, flex: 1 }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                close();
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}, [
  showHeaderPropertyModal,
  showPropertyModal,
  propertyModalMode,
  propertySearchTerm,
  filteredProperties,
  chosenProperty,
  selectedTargetNodeId,
  nodes,
  selectedNode,
  edgeBeingEdited,
  pendingNodeClass,
  pendingHeader,
  canvasApiRef,
  makeEdge,
  addLinkedNode,
  addPropertyEdgeBetweenExisting,
  validateProperty,
  propFilterInfo,
  setEdges,
  setEdgeBeingEdited,
  setSelectedTargetNodeId,
  setChosenProperty,
  setPropertySearchTerm,
  setShowPropertyModal,
  setShowHeaderPropertyModal,
  setPendingNodeClass,
  setPendingHeader,
  setHeaderLinks,
  showToast
]);
  // ============================================================================
  // Node Options Modal (2x3 Grid)
  // ============================================================================
  const NodeOptionsModal = useCallback(() => {
  if (!showNodeOptions || !selectedNode) return null;

  return (
    <>
      <div
        className="ontotron-backdrop"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 9998,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setShowNodeOptions(false);
        }}
      />
      <div 
        style={{ ...retroTheme.modal, width: "480px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={retroTheme.modalHeader}>
          <span>Node: {selectedNode.data?.label || selectedNode.id}</span>
          <button
            style={{
              background: "#c0c0c0",
              border: "1px solid",
              borderColor: "#ffffff #000000 #000000 #ffffff",
              padding: "0 6px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
            onClick={(e) => {
              e.stopPropagation();
              setShowNodeOptions(false);
            }}
          >
            ✕
          </button>
        </div>
        <div style={retroTheme.modalContent}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
          }}>
            <button
              style={{
                ...retroTheme.button,
                height: "60px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={(e) => {
                e.stopPropagation();
                setShowNodeOptions(false);
                setNodeClassSearchTerm("");
                setPropertyModalMode("newFromNode");
                setShowNodeClassModal(true);
              }}
            >
              <span style={{ fontSize: "18px" }}>➕</span>
              <span style={{ fontSize: "10px", marginTop: "4px" }}>Add Linked Node</span>
            </button>
            
            <button
              style={{
                ...retroTheme.button,
                height: "60px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={(e) => {
                e.stopPropagation();
                setShowNodeOptions(false);
                setPropertyModalMode("connectExisting");
                setChosenProperty(null);
                setPropertySearchTerm("");
                setSelectedTargetNodeId("");
                setShowPropertyModal(true);
              }}
            >
              <span style={{ fontSize: "18px" }}>🔗</span>
              <span style={{ fontSize: "10px", marginTop: "4px" }}>Connect to Node</span>
            </button>
            
            <button
              style={{
                ...retroTheme.dangerButton,
                height: "60px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete node "${selectedNode.data?.label}"?`)) {
                  setEdges(eds => eds.filter(e => 
                    e.source !== selectedNode.id && e.target !== selectedNode.id
                  ));
                  setHeaderLinks(links => links.filter(l => l.nodeId !== selectedNode.id));
                  setNodes(nds => nds.filter(n => n.id !== selectedNode.id));
                  setSelectedNode(null);
                  setShowNodeOptions(false);
                  showToast("✅ Node deleted");
                }
              }}
            >
              <span style={{ fontSize: "18px" }}>🗑️</span>
              <span style={{ fontSize: "10px", marginTop: "4px" }}>Delete Node</span>
            </button>
            
            <button
              style={{
                ...retroTheme.button,
                height: "60px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={(e) => {
                e.stopPropagation();
                const newLabel = window.prompt("Edit label:", selectedNode.data?.label || "");
                if (newLabel != null) {
                  setNodes(nds => nds.map(n =>
                    n.id === selectedNode.id
                      ? { ...n, data: { ...n.data, label: newLabel } }
                      : n
                  ));
                  showToast("✅ Label updated");
                }
                setShowNodeOptions(false);
              }}
            >
              <span style={{ fontSize: "18px" }}>✏️</span>
              <span style={{ fontSize: "10px", marginTop: "4px" }}>Edit Label</span>
            </button>
            
            <button
              style={{
                ...retroTheme.button,
                height: "60px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={(e) => {
                e.stopPropagation();
                setShowNodeOptions(false);
                setCustomLabel("");
                setCustomDef("");
                setCustomParentSearch("");
                setCustomParentPicked(null);
                setShowCustomModal(true);
              }}
            >
              <span style={{ fontSize: "18px" }}>⚙️</span>
              <span style={{ fontSize: "10px", marginTop: "4px" }}>Custom Class</span>
            </button>
            
            <button
              style={{
                ...retroTheme.button,
                height: "60px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={(e) => {
                e.stopPropagation();
                setShowNodeOptions(false);
                setShowExistingNodeModal(true);
              }}
            >
              <span style={{ fontSize: "18px" }}>📌</span>
              <span style={{ fontSize: "10px", marginTop: "4px" }}>Select Existing</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}, [
  showNodeOptions,
  selectedNode,
  setEdges,
  setHeaderLinks,
  setNodes,
  setSelectedNode,
  setShowNodeOptions,
  setNodeClassSearchTerm,
  setPropertyModalMode,
  setShowNodeClassModal,
  setChosenProperty,
  setPropertySearchTerm,
  setSelectedTargetNodeId,
  setShowPropertyModal,
  setCustomLabel,
  setCustomDef,
  setCustomParentSearch,
  setCustomParentPicked,
  setShowCustomModal,
  showToast
]);

// ============================================================================
// Existing Node Selection Modal
// ============================================================================
const ExistingNodeModal = useCallback(() => {
  if (!showExistingNodeModal || !selectedNode) return null;

  // Get all non-anchor nodes
  const existingNodes = nodes.filter(n => 
    !n.id.startsWith("anchor-") && 
    n.id !== selectedNode.id
  );

  return (
    <>
      <div
        className="ontotron-backdrop"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 9998,
        }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            setShowExistingNodeModal(false);
          }
        }}
      />
      <div 
        style={{ ...retroTheme.modal, width: "450px" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={retroTheme.modalHeader}>
          <span>Select Existing Node to Link</span>
          <button
            style={{
              background: "#c0c0c0",
              border: "1px solid",
              borderColor: "#ffffff #000000 #000000 #ffffff",
              padding: "0 6px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowExistingNodeModal(false);
            }}
          >
            ✕
          </button>
        </div>
        <div style={retroTheme.modalContent}>
          <div style={{
            marginBottom: "8px",
            padding: "6px",
            background: "#e0f0ff",
            border: "1px solid #0066cc",
            fontSize: "11px",
            borderRadius: "3px",
          }}>
            Linking from: <strong>{selectedNode.data?.label || selectedNode.id}</strong>
          </div>

          <div style={{
            maxHeight: "320px",
            overflowY: "auto",
            border: "2px solid",
            borderColor: "#000000 #ffffff #ffffff #000000",
            background: "#ffffff",
            marginBottom: "8px",
          }}>
            {existingNodes.length === 0 && (
              <div style={{ padding: "20px", textAlign: "center", color: "#666666" }}>
                No other nodes available. Create a new node first!
              </div>
            )}
            {existingNodes.map((node) => (
              <div
                key={node.id}
                style={{
                  ...retroTheme.listItem,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#316ac5";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "inherit";
                }}
               onMouseDown={(e) => {
  e.stopPropagation();
  e.preventDefault();
  
  // If coming from browser with a class to add
  if (pendingNodeClass) {
    setSelectedNode(node);
    setSelectedTargetNodeId("");
    setShowExistingNodeModal(false);
    setPropertyModalMode("newFromNode");
    setChosenProperty(null);
    setPropertySearchTerm("");
    setTimeout(() => setShowPropertyModal(true), 100);
  } else {
    // Regular existing node connection
    setSelectedTargetNodeId(node.id);
    setShowExistingNodeModal(false);
    setPropertyModalMode("connectExisting");
    setChosenProperty(null);
    setPropertySearchTerm("");
    setTimeout(() => setShowPropertyModal(true), 100);
  }
}}
              >
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "6px",
                  width: "100%",
                }}>
                  <strong>{node.data?.label || tail(node.data?.uri)}</strong>
                  {node.data?.isCustom && (
                    <span style={{
                      background: "#ffcc00",
                      color: "#000000",
                      fontSize: "8px",
                      padding: "1px 4px",
                      borderRadius: "2px",
                      fontWeight: "bold",
                    }}>
                      CUSTOM
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "9px", opacity: 0.8, marginTop: "2px" }}>
                  {node.data?.uri || node.id}
                </div>
              </div>
            ))}
          </div>
          
          <button
            style={{ ...retroTheme.button, width: "100%" }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowExistingNodeModal(false);
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}, [
  showExistingNodeModal,
  selectedNode,
  nodes,
  setShowExistingNodeModal,
  setSelectedTargetNodeId,
  setPropertyModalMode,
  setChosenProperty,
  setPropertySearchTerm,
  setShowPropertyModal,
]);

// ============================================================================
// Mermaid Syntax Modal
// ============================================================================
const MermaidModal = useCallback(() => {
  if (!showMermaidModal) return null;

  return (
    <div style={retroTheme.modalBackdrop} onMouseDown={() => setShowMermaidModal(false)}>
      <div
        style={{ ...retroTheme.modal, width: "600px", maxHeight: "80vh" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={retroTheme.modalHeader}>
          <span>📊 Mermaid Diagram Syntax</span>
          <button
            style={retroTheme.closeButton}
            onMouseDown={() => setShowMermaidModal(false)}
          >
            ✕
          </button>
        </div>
        <div style={{ ...retroTheme.modalBody, maxHeight: "60vh", overflowY: "auto" }}>
          <p style={{ marginBottom: "12px", fontSize: "12px", color: "#666" }}>
            Copy this syntax and paste it into a Mermaid viewer (like{" "}
            <a href="https://mermaid.live" target="_blank" rel="noopener noreferrer" style={{ color: "#0066cc" }}>
              mermaid.live
            </a>
            ) to visualize your model:
          </p>
          <textarea
            readOnly
            value={mermaidSyntax}
            style={{
              width: "100%",
              height: "400px",
              fontFamily: "monospace",
              fontSize: "11px",
              padding: "8px",
              border: "2px solid #808080",
              borderRadius: "4px",
              background: "#f5f5f5",
              resize: "none",
            }}
            onClick={(e) => e.target.select()}
          />
        </div>
        <div style={retroTheme.modalFooter}>
          <button
            style={retroTheme.button}
            onMouseDown={() => {
              navigator.clipboard.writeText(mermaidSyntax);
              alert("Mermaid syntax copied to clipboard!");
            }}
          >
            📋 Copy to Clipboard
          </button>
          <button style={retroTheme.buttonSecondary} onMouseDown={() => setShowMermaidModal(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}, [showMermaidModal, mermaidSyntax]);

  // ============================================================================
  // Edge Context Menu
  // ============================================================================
  const EdgeContextMenu = useCallback(() => {
  if (!edgeContext || !edgeBeingEdited) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: edgeContext.y,
        left: edgeContext.x,
        ...retroTheme.modal,
        width: "200px",
        transform: "none",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={retroTheme.modalHeader}>
        <span>Edge Options</span>
      </div>
      <div style={retroTheme.modalContent}>
        <button
          style={{ ...retroTheme.button, width: "100%", marginBottom: "4px" }}
          onClick={(e) => {
            e.stopPropagation();
            setPropertyModalMode("editEdge");
            setShowPropertyModal(true);
            setEdgeContext(null);
          }}
        >
          ✏️ Change Property
        </button>
        <button
          style={{ ...retroTheme.dangerButton, width: "100%" }}
          onClick={(e) => {
            e.stopPropagation();
            setEdges(eds => eds.filter(e => e.id !== edgeBeingEdited.edge.id));
            setEdgeBeingEdited(null);
            setEdgeContext(null);
            showToast("✅ Edge deleted");
          }}
        >
          🗑️ Delete Edge
        </button>
      </div>
    </div>
  );
}, [
  edgeContext,
  edgeBeingEdited,
  setPropertyModalMode,
  setShowPropertyModal,
  setEdgeContext,
  setEdges,
  setEdgeBeingEdited,
  showToast
]);

  // ============================================================================
  // Toast Notification
  // ============================================================================
  const Toast = useCallback(() => {
    if (!toast) return null;

    return (
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          ...retroTheme.modal,
          width: "auto",
          minWidth: "200px",
          maxWidth: "400px",
          transform: "none",
        }}
      >
        <div style={{ ...retroTheme.modalHeader, background: "#ffcc00" }}>
          <span style={{ color: "#000000" }}>Notification</span>
        </div>
        <div style={retroTheme.modalContent}>
          <div style={{ whiteSpace: "pre-line" }}>{toast}</div>
        </div>
      </div>
    );
  }, [toast]);
 // ============================================================================
// ONTO-TRON-5000 — Full Application Rebuild
// Part 5 of 5: Canvas Component and Main Render (HARDENED & CLICK-BRIDGED)
// ============================================================================

  // ============================================================================
  // Ontology Canvas Component
  // ============================================================================
  const OntologyCanvas = forwardRef(function OntologyCanvas(
    { nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick,
      onEdgeContextMenu, setNodes, headers, tableRef },
    ref
  ) {
    const canvasRef = useRef(null);
    const { getViewport } = useReactFlow();

    // Safe viewport helper (prevents NaN from undefined zoom/x/y)
    const safeGetViewport = useCallback(() => {
  if (!getViewport) return { x: 0, y: 0, zoom: 1 };
  
  try {
    const vp = typeof getViewport === "function" ? getViewport() : null;
    if (!vp) return { x: 0, y: 0, zoom: 1 };
    
    const x = Number(vp?.x);
    const y = Number(vp?.y);
    const zoom = Number(vp?.zoom);
    return {
      x: Number.isFinite(x) ? x : 0,
      y: Number.isFinite(y) ? y : 0,
      zoom: Number.isFinite(zoom) && zoom > 0 ? zoom : 1,
    };
  } catch {
    return { x: 0, y: 0, zoom: 1 };
  }
}, [getViewport]);

    // Create invisible anchor nodes for headers
    useEffect(() => {
      if (!headers.length) return;

      const placeAnchors = () => {
        const wrapper = canvasRef.current;
        const table = tableRef.current;
        if (!wrapper || !table) return;

        const wrapperRect = wrapper.getBoundingClientRect?.();
        const headerCells = table.querySelectorAll?.("thead th") || [];
        if (!wrapperRect || !headerCells.length) return;

        const vp = safeGetViewport();

        const newAnchors = Array.from(headerCells)
          .map((th, index) => {
            const cellRect = th.getBoundingClientRect?.();
            if (!cellRect) return null;

            const centerX =
              Number(cellRect.left) + Number(cellRect.width) / 2 - Number(wrapperRect.left);
            const bottomY = Number(wrapperRect.height) - 20;

            if (!Number.isFinite(centerX) || !Number.isFinite(bottomY)) return null;

            const flowX = (centerX - vp.x) / vp.zoom;
            const flowY = (bottomY - vp.y) / vp.zoom;

            if (!Number.isFinite(flowX) || !Number.isFinite(flowY)) return null;

            return {
              id: `anchor-${index}`,
              type: "default",
              position: { x: flowX - 5, y: flowY },
              targetPosition: Position.Top,
              sourcePosition: Position.Bottom,
              data: { label: headers[index] },
              draggable: false,
              selectable: true,
              focusable: false,
              style: {
                width: "10px",
                height: "10px",
                opacity: 0,
                pointerEvents: "none",
                background: "transparent",
                border: "none",
              },
            };
          })
          .filter(Boolean); // drop any invalid/NaN anchors

        if (!newAnchors.length) return;

        setNodes(prevNodes => [
          ...prevNodes.filter(n => !n.id.startsWith("anchor-")),
          ...newAnchors,
        ]);
      };

      // Initial + delayed to allow layout to settle
      requestAnimationFrame(placeAnchors);
      const timers = [
        setTimeout(placeAnchors, 100),
        setTimeout(placeAnchors, 300),
        setTimeout(placeAnchors, 600),
      ];

      const handleResize = () => placeAnchors();
      window.addEventListener("resize", handleResize);

      const handleScroll = () => placeAnchors();
      tableRef.current?.addEventListener("scroll", handleScroll, { passive: true });

      return () => {
        timers.forEach(clearTimeout);
        window.removeEventListener("resize", handleResize);
        tableRef.current?.removeEventListener("scroll", handleScroll);
      };
    }, [headers, safeGetViewport, setNodes, tableRef]);

    // Expose API for creating nodes (header → node)
    useImperativeHandle(ref, () => ({
      addNodeForHeader: (header, classUri, classLabel) => {
        const table = tableRef.current;
        const wrapper = canvasRef.current;
        if (!table || !wrapper) return null;

        const headerCells = table.querySelectorAll?.("thead th") || [];
        const headerIndex = headers.indexOf(header);
        const headerCell = headerCells?.[headerIndex];
        if (!headerCell) return null;

        const vp = safeGetViewport();
        const cellRect = headerCell.getBoundingClientRect?.();
        const wrapperRect = wrapper.getBoundingClientRect?.();
        if (!cellRect || !wrapperRect) return null;

        const centerX =
          Number(cellRect.left) + Number(cellRect.width) / 2 - Number(wrapperRect.left);
        const middleY = Number(wrapperRect.height) * 0.5;

        if (!Number.isFinite(centerX) || !Number.isFinite(middleY)) return null;

        const flowX = (centerX - vp.x) / vp.zoom;
        const flowY = (middleY - vp.y) / vp.zoom;

        if (!Number.isFinite(flowX) || !Number.isFinite(flowY)) return null;

        const nodeId = uid("node");
        const newNode = {
          id: nodeId,
          type: "clickable", // must match nodeTypes
          position: { x: flowX - 100, y: flowY },
          data: {
            label: classLabel || tail(classUri),
            uri: classUri,
            isAutoFromHeader: true,
            __open: makeOpenForId(nodeId), // inject click handler
          },
          style: { width: 200, height: 60 },
          selectable: true,  // ADD THIS LINE

        };

        setNodes(prev => [...prev, newNode]);
        return nodeId;
      },
    }));

    
    return (
      <div
        ref={canvasRef}
        style={{
          position: "relative",
          height: "60vh",
          borderBottom: "2px ridge #808080",
          background: "linear-gradient(180deg, #ffffff 0%, #e8e8f0 100%)",
        }}
      >
   <ReactFlow
  nodes={nodes.filter(n => n.position && Number.isFinite(n.position.x) && Number.isFinite(n.position.y))}
  edges={edges}
  nodeTypes={nodeTypes}
  edgeTypes={edgeTypes} 
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
  onNodeClick={onNodeClick}
  onNodeDoubleClick={onNodeClick}
  onEdgeContextMenu={onEdgeContextMenu}
  onPaneClick={() => console.log('🖱️ Canvas clicked!')}  // ADD THIS LINE
  onMove={() => console.log('📍 Canvas moved!')} 
  nodesDraggable={true}
  nodesConnectable={true}
  nodesFocusable={true}
  elementsSelectable={true}
  panOnDrag={true}             
  panOnScroll={true}
  zoomOnScroll={true}
  zoomOnPinch={true}
  zoomOnDoubleClick={false}
  selectNodesOnDrag={false}
  minZoom={0.3}
  maxZoom={2.5}
  defaultViewport={{ x: 0, y: 0, zoom: 1 }}
  defaultEdgeOptions={{
    animated: false,
    style: { stroke: "#000080", strokeWidth: 2 },
  }}
>
          <MiniMap
            nodeColor={(n) => n.id.startsWith("anchor-") ? "transparent" : "#000080"}
            style={{
              position: "absolute",
              right: "10px",
              bottom: "10px",
              width: "150px",
              height: "100px",
              background: "rgba(255,255,255,0.9)",
              border: "2px solid #808080",
              zIndex: 600,
            }}
          />
          <Controls
            style={{
              position: "absolute",
              left: "10px",
              bottom: "10px",
              zIndex: 600,
            }}
          />
          <Background color="#d0d0e0" gap={20} size={1} />
        </ReactFlow>
      </div>
    );
  });

  // ============================================================================
  // Global Styles
  // ============================================================================
  const GlobalStyle = () => (
    <style>{`
      .react-flow__attribution { display: none !important; }
      .react-flow__edge, .react-flow__edge-path { transition: none !important; }
      .react-flow__edge-text { pointer-events: all !important; cursor: pointer !important; }
      .react-flow__edge-textbg { pointer-events: all !important; }
      .react-flow__node.selected { outline: none !important; }
      .react-flow__handle { opacity: 0; transition: opacity 0.2s; }
      .react-flow__node:hover .react-flow__handle { opacity: 1; }
      ::-webkit-scrollbar { width: 12px; height: 12px; }
      ::-webkit-scrollbar-track { background: #c0c0c0; border: 1px solid #808080; }
      ::-webkit-scrollbar-thumb { 
        background: linear-gradient(180deg, #ffffff 0%, #c0c0c0 50%, #808080 100%); 
        border: 1px solid #808080; 
      }
      ::-webkit-scrollbar-corner { background: #c0c0c0; }
    `}</style>
  );

  // ============================================================================
  // Main Application Render
  // ============================================================================
  return (
    <div
      ref={rootRef}
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Tahoma, 'Segoe UI', Geneva, Verdana, sans-serif",
        background: "#c0c0c0",
        overflow: "hidden",
      }}
    >
      <GlobalStyle />
      
      {/* Title bar */}
      <div style={{
        background: "linear-gradient(90deg, #000080 0%, #1084d0 100%)",
        color: "#ffffff",
        padding: "4px 8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "2px solid #000000",
        userSelect: "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px", fontWeight: "bold" }}>🔧</span>
          <span style={{ fontWeight: "bold", fontSize: "14px" }}>
            ONTO-TRON-5000 — Ontology Mapping System
          </span>
        </div>
        <div style={{ fontSize: "12px" }}>{new Date().toLocaleString()}</div>
      </div>
      
      {/* Toolbar */}
      <div style={{
  padding: "8px",
  borderBottom: "2px ridge #808080",
  display: "flex",
  gap: "8px",
  alignItems: "center",
  background: "linear-gradient(180deg, #ffffff 0%, #c0c0c0 100%)",
}}>
  <label style={{
    ...retroTheme.button,
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  }}>
    📁 Load CSV
    <input
      type="file"
      accept=".csv"
      onChange={handleFileUpload}
      style={{ display: "none" }}
    />
</label>

{/* Always visible buttons */}
<button style={retroTheme.button} onClick={generateR2RML}>
  📋 Generate R2RML
</button>
<button style={retroTheme.button} onClick={generateMermaid}>
  📊 Generate Model
</button>

{/* Only show after CSV is loaded */}
{headers.length > 0 && (
  <>
    <button style={retroTheme.button} onClick={generateRDF}>
      💾 Generate RDF
    </button>
    <div style={{ marginLeft: "auto", fontSize: "12px", color: "#444444" }}>
      {csvData.length} rows • {headers.length} columns • 
      {nodes.filter(n => !n.id.startsWith("anchor-")).length} nodes • 
      {edges.length} edges
    </div>
  </>
)}

{/* Ontology Browser Toggle Button */}
<button
    style={{
      ...retroTheme.button,
      marginLeft: headers.length > 0 ? "8px" : "auto",
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
    }}
    onClick={() => setShowBrowserPanel(!showBrowserPanel)}
  >
    🔍 {showBrowserPanel ? "Hide" : "Browse"} Ontology
  </button>
</div>
      
      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <ReactFlowProvider>
          <OntologyCanvas
            ref={canvasApiRef}
            nodes={nodes}
            edges={stableEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            onEdgeContextMenu={handleEdgeContextMenu}
            setNodes={setNodes}
            headers={headers}
            tableRef={tableRef}
          />
        </ReactFlowProvider>
        
        {/* CSV Table */}
        <div
          ref={tableScrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            background: "#ffffff",
            borderTop: "2px ridge #808080",
          }}
        >
          {headers.length === 0 ? (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#666666",
              fontSize: "14px",
              textAlign: "center",
              padding: "20px",
            }}>
              <div>
                <div style={{ fontSize: "48px", marginBottom: "20px" }}>📊</div>
                <div>Load a CSV file to begin mapping</div>
                <div style={{ fontSize: "12px", marginTop: "10px", opacity: 0.7 }}>
                  Select "Load CSV" from the toolbar above
                </div>
              </div>
            </div>
          ) : (
            <>
              <table
                ref={tableRef}
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "11px",
                }}
              >
                <thead>
                  <tr>
                    {headers.map((header, index) => (
                      <th key={header} style={retroTheme.tableHeader}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <div style={{ fontWeight: "bold" }}>{header}</div>
                          <button
                            style={{ ...retroTheme.button, fontSize: "10px", padding: "2px 6px" }}
                            onClick={() => {
                              setActiveHeader(header);
                              setPendingHeader({ header, anchorId: `anchor-${index}` });
                              setHeaderSearchTerm("");
                            }}
                          >
                            Set Type
                          </button>
                          {mappings[header] && (
                            <div style={{
                              fontSize: "9px",
                              color: "#0066cc",
                              background: "#e0f0ff",
                              padding: "2px",
                              borderRadius: "2px",
                            }}>
                              {tail(mappings[header])}
                            </div>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {headers.map((header) => (
                        <td key={header} style={retroTheme.tableCell}>
                          {row[header]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {csvData.length > rowsShown && (
                <div style={{ textAlign: "center", padding: "12px", background: "#f0f0f0" }}>
                  <button
                    style={retroTheme.button}
                    onClick={() => setRowsShown(prev => prev + 50)}
                  >
                    Load 50 More Rows ({csvData.length - rowsShown} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Modals */}
      <HeaderClassPicker />
      <NodeClassModal />
      <CustomClassModal />
      <NodeOptionsModal />
      <ExistingNodeModal />
      <MermaidModal />
      <PropertyModal isHeader={false} />
      <PropertyModal isHeader={true} />
      <EdgeContextMenu />
      <Toast />
      <OntologyBrowserPanel />
    </div>
  );
}
// ============================================================================
// END OF COMPLETE APPLICATION
// ============================================================================
